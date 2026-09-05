import "server-only";

import type { PoolClient } from "pg";
import type { PersonValues } from "@/app/admin/people/person-validation";
import { pool } from "./db";

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
    `INSERT INTO people (first_name, last_name, birthday, deathday, spouse, parent_id)
     VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
    [
      values.firstName,
      values.lastName,
      values.birthday,
      values.deathday,
      values.spouse,
      values.parentId,
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
       deathday = $4, spouse = $5, parent_id = $6 WHERE id = $7`,
    [
      values.firstName,
      values.lastName,
      values.birthday,
      values.deathday,
      values.spouse,
      values.parentId,
      personId,
    ],
  );
}
