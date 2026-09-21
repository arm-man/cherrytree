import "server-only";

import type { PoolClient } from "pg";
import type { PersonValues } from "@/app/admin/people/person-validation";
import { insertLog, pool } from "./db";
import { sendLogEmail } from "./log-email";
import { validateParentRelationships } from "./people";
import type { Person } from "./people";

export type AdminPerson = Person;

export async function readAdminPeople(
  client?: PoolClient,
): Promise<AdminPerson[]> {
  // Keep the public query and its browser payload limited to public fields.
  const result = await (client ?? pool).query<AdminPerson>(
    `SELECT id, parent_id AS "parentId", first_name AS "firstName",
       last_name AS "lastName", TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday,
       TO_CHAR(deathday, 'YYYY-MM-DD') AS deathday,
       phone_number AS "phoneNumber"
     FROM people ORDER BY id`,
  );
  validateParentRelationships(result.rows);
  return result.rows;
}

export async function withPeopleTransaction<T>(
  operation: (
    client: PoolClient,
    writeInfoLog: (message: string) => Promise<void>,
  ) => Promise<T>,
): Promise<T> {
  const client = await pool.connect();
  const committedLogMessages: string[] = [];
  let discardClient = false;
  let result: T;
  try {
    await client.query("BEGIN");
    await client.query("SET LOCAL TIME ZONE 'UTC'");
    // Serialize writers before reading the graph. Ordinary readers remain unblocked.
    // A transaction alone would allow two requests to validate stale relationships.
    await client.query("LOCK TABLE people IN SHARE ROW EXCLUSIVE MODE");
    result = await operation(client, async (message: string) => {
      await insertLog(client, message, "info");
      committedLogMessages.push(message);
    });
    await client.query("COMMIT");
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

  // Notify only after commit and connection release. The helper absorbs delivery
  // failures so email can never change the result of the completed transaction.
  for (const message of committedLogMessages) {
    await sendLogEmail(message);
  }
  return result;
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
    `INSERT INTO people (first_name, last_name, birthday, deathday, parent_id, phone_number)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      values.firstName,
      values.lastName,
      values.birthday,
      values.deathday,
      values.parentId,
      values.phoneNumber,
    ],
  );
  return result.rows[0].id;
}

export async function updatePerson(
  client: PoolClient,
  personId: number,
  values: PersonValues,
): Promise<void> {
  await client.query(
    `UPDATE people SET first_name = $1, last_name = $2, birthday = $3,
       deathday = $4, parent_id = $5, phone_number = $6 WHERE id = $7`,
    [
      values.firstName,
      values.lastName,
      values.birthday,
      values.deathday,
      values.parentId,
      values.phoneNumber,
      personId,
    ],
  );
}
