import "server-only";

import type { PoolClient } from "pg";
import type {
  AdminPartner,
  PartnerValues,
} from "@/app/admin/partners/partner-validation";
import { pool } from "./db";

export async function readAdminPartners(
  client?: PoolClient,
): Promise<AdminPartner[]> {
  const result = await (client ?? pool).query<AdminPartner>(
    `SELECT id, partner_id AS "partnerId", first_name AS "firstName", last_name AS "lastName",
       TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday, TO_CHAR(deathday, 'YYYY-MM-DD') AS deathday
     FROM partners ORDER BY id`,
  );
  return result.rows;
}

export async function writePartner(
  client: PoolClient,
  values: PartnerValues,
  partnerId?: number,
): Promise<number> {
  const parameters = [
    values.firstName,
    values.lastName,
    values.birthday,
    values.deathday,
    values.partnerId,
  ];
  const result =
    partnerId === undefined
      ? await client.query<{ id: number }>(
          `INSERT INTO partners (first_name, last_name, birthday, deathday, partner_id)
         VALUES ($1, $2, $3, $4, $5) RETURNING id`,
          parameters,
        )
      : await client.query<{ id: number }>(
          `UPDATE partners SET first_name = $1, last_name = $2, birthday = $3, deathday = $4,
         partner_id = $5 WHERE id = $6 RETURNING id`,
          [...parameters, partnerId],
        );
  return result.rows[0].id;
}
