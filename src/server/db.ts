import "server-only";

import { Pool } from "pg";
import type { PoolClient } from "pg";
import { sendLogEmail } from "./log-email";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL environment variable is required.");
}

export const pool = new Pool({ connectionString });

export async function insertLog(
  client: Pool | PoolClient,
  message: string,
  severity: "error" | "warning" | "info" = "error",
): Promise<void> {
  await client.query(
    "INSERT INTO logs (severity, message) VALUES ($1, $2)",
    [severity, message],
  );
}

export async function logServerError(message: string): Promise<void> {
  try {
    await insertLog(pool, message);
  } catch (loggingError: unknown) {
    console.error("Failed to write an error to the database log.", loggingError);
    return;
  }

  await sendLogEmail(message);
}
