import "server-only";

import type { PoolClient } from "pg";
import type { PersonValues } from "@/app/admin/people/person-validation";
import { pool } from "./db";
import { validateParentRelationships } from "./people";
import type { Person } from "./people";

export interface AdminPerson extends Person {
  phoneNumber: string | null;
  spouseBirthday: string | null;
  spouseDeathday: string | null;
}

export async function readAdminPeople(
  client?: PoolClient,
): Promise<AdminPerson[]> {
  // Keep the public query and its browser payload limited to public fields.
  const result = await (client ?? pool).query<AdminPerson>(
    `SELECT id, parent_id AS "parentId", first_name AS "firstName",
       last_name AS "lastName", TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday,
       TO_CHAR(deathday, 'YYYY-MM-DD') AS deathday, spouse,
       phone_number AS "phoneNumber",
       TO_CHAR(spouse_birthday, 'YYYY-MM-DD') AS "spouseBirthday",
       TO_CHAR(spouse_deathday, 'YYYY-MM-DD') AS "spouseDeathday"
     FROM people ORDER BY id`,
  );
  validateParentRelationships(result.rows);
  return result.rows;
}

export async function withPeopleTransaction<T>(
  operation: (client: PoolClient) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  let discardClient = false;
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL TIME ZONE 'UTC'");
    // Serialize writers before reading the graph. Ordinary readers remain unblocked.
    // A transaction alone would allow two requests to validate stale relationships.
    await client.query("LOCK TABLE people IN SHARE ROW EXCLUSIVE MODE");
    const result = await operation(client);
    await client.query("COMMIT");
    return result;
  } catch (error: unknown) {
    try {
      await client.query("ROLLBACK");
    } catch {
      discardClient = true;
      console.error(
        "Failed to roll back a People transaction; discarding its connection.",
      );
    }
    throw error;
  } finally {
    client.release(discardClient);
  }
}

export async function getValidationDate(client: PoolClient): Promise<string> {
  const result = await client.query<{ today: string }>(
    "SELECT TO_CHAR(CURRENT_DATE, 'YYYY-MM-DD') AS today",
  );
  return result.rows[0].today;
}

export async function insertPerson(
  client: PoolClient,
  values: PersonValues,
): Promise<number> {
  const result = await client.query<{ id: number }>(
    `INSERT INTO people (first_name, last_name, birthday, deathday, spouse, parent_id,
       phone_number, spouse_birthday, spouse_deathday)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING id`,
    [
      values.firstName,
      values.lastName,
      values.birthday,
      values.deathday,
      values.spouse,
      values.parentId,
      values.phoneNumber,
      values.spouseBirthday,
      values.spouseDeathday,
    ],
  );
  return result.rows[0].id;
}

export async function insertPersonLog(
  client: PoolClient,
  message: string,
): Promise<void> {
  // Use the save transaction so the Person and all its logs commit together.
  await client.query(
    "INSERT INTO logs (severity, message) VALUES ('info', $1)",
    [message],
  );
}

export async function updatePerson(
  client: PoolClient,
  personId: number,
  values: PersonValues,
): Promise<void> {
  await client.query(
    `UPDATE people SET first_name = $1, last_name = $2, birthday = $3,
       deathday = $4, spouse = $5, parent_id = $6,
       phone_number = $7, spouse_birthday = $8, spouse_deathday = $9 WHERE id = $10`,
    [
      values.firstName,
      values.lastName,
      values.birthday,
      values.deathday,
      values.spouse,
      values.parentId,
      values.phoneNumber,
      values.spouseBirthday,
      values.spouseDeathday,
      personId,
    ],
  );
}
