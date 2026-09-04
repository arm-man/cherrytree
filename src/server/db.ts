import "server-only";

import { Pool, type QueryResultRow } from "pg";

interface CurrentDatabaseTimeRow extends QueryResultRow {
  currentTime: Date;
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required.");
}

export const pool = new Pool({ connectionString });

export async function getCurrentDatabaseTime(): Promise<Date> {
  const result = await pool.query<CurrentDatabaseTimeRow>(
    'SELECT CURRENT_TIMESTAMP AS "currentTime"',
  );

  return result.rows[0].currentTime;
}
