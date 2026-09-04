import "server-only";

import type { QueryResultRow } from "pg";

import { pool } from "@/server/db";

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string;
  deathday: string | null;
  spouse: string | null;
}

type PersonRow = QueryResultRow & Person;

export async function getPersonById(id: number): Promise<Person | null> {
  const result = await pool.query<PersonRow>(
    `SELECT
       id,
       first_name AS "firstName",
       last_name AS "lastName",
       TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday,
       TO_CHAR(deathday, 'YYYY-MM-DD') AS deathday,
       spouse
     FROM people
     WHERE id = $1`,
    [id],
  );

  return result.rows[0] ?? null;
}
