import "server-only";

import type { PoolClient } from "pg";
import type {
  AdminAncestor,
  AncestorValues,
} from "@/app/admin/ancestors/ancestor-validation";
import { pool } from "./db";

export async function readAdminAncestors(
  client?: PoolClient,
): Promise<AdminAncestor[]> {
  const result = await (client ?? pool).query<AdminAncestor>(
    `SELECT id, spouse, first_name AS "firstName", last_name AS "lastName",
       TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday, TO_CHAR(deathday, 'YYYY-MM-DD') AS deathday
     FROM ancestors ORDER BY id`,
  );
  return result.rows;
}

export async function writeAncestor(
  client: PoolClient,
  values: AncestorValues,
  ancestorId?: number,
): Promise<number> {
  const parameters = [
    values.firstName,
    values.lastName,
    values.birthday,
    values.deathday,
    values.spouse,
  ];
  const result =
    ancestorId === undefined
      ? await client.query<{ id: number }>(
          `INSERT INTO ancestors (first_name, last_name, birthday, deathday, spouse)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          parameters,
        )
      : await client.query<{ id: number }>(
          `UPDATE ancestors SET first_name = $1, last_name = $2, birthday = $3, deathday = $4,
         spouse = $5 WHERE id = $6 RETURNING id`,
          [...parameters, ancestorId],
        );
  return result.rows[0].id;
}
