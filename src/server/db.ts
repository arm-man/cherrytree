import "server-only";

import { Pool } from "pg";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required.");
}

export const pool = new Pool({ connectionString });

export async function logServerError(message: string): Promise<void> {
  try {
    await pool.query("INSERT INTO logs (message) VALUES ($1)", [message]);
  } catch (loggingError: unknown) {
    console.error("Failed to write an error to the database log.", loggingError);
  }
}
