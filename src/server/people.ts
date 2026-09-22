import "server-only";

import type { PoolClient, QueryResultRow } from "pg";

import { pool } from "@/server/db";
import type { PublicPerson, PublicPartner } from "@/app/public-display";

export type Person = PublicPerson;

type PersonRow = QueryResultRow & Person;

export function validateParentRelationships(
  people: Pick<Person, "id" | "parentId">[],
): void {
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const rootCount = people.filter((person) => person.parentId === null).length;

  if (rootCount !== 1) {
    throw new Error("People data must contain exactly one root Person.");
  }

  if (peopleById.get(1)?.parentId !== null) {
    throw new Error("Person 1 must be the single root Person.");
  }

  // Following every parent chain verifies that each Person reaches the one root
  // and detects cycles before relationship data is sent to the browser.
  for (const person of people) {
    const visitedIds = new Set<number>();
    let currentPerson: Pick<Person, "id" | "parentId"> | undefined = person;

    while (currentPerson.parentId !== null) {
      if (visitedIds.has(currentPerson.id)) {
        throw new Error("People data contains a parent relationship cycle.");
      }

      visitedIds.add(currentPerson.id);
      currentPerson = peopleById.get(currentPerson.parentId);

      if (!currentPerson) {
        throw new Error("People data references a missing parent.");
      }
    }
  }
}

export async function getPeople(client?: PoolClient): Promise<Person[]> {
  const result = await (client ?? pool).query<PersonRow>(
    `SELECT
       id,
       parent_id AS "parentId",
       is_step_or_adopted AS "isStepOrAdopted",
       first_name AS "firstName",
       last_name AS "lastName",
       TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday,
       TO_CHAR(deathday, 'YYYY-MM-DD') AS deathday,
       phone_number AS "phoneNumber"
     FROM people
     ORDER BY id`,
  );

  validateParentRelationships(result.rows);

  return result.rows;
}

export async function getPartners(): Promise<PublicPartner[]> {
  const result = await pool.query<PublicPartner>(
    `SELECT id, partner_id AS "partnerId",
       first_name AS "firstName", last_name AS "lastName",
       TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday,
       TO_CHAR(deathday, 'YYYY-MM-DD') AS deathday
     FROM partners
     ORDER BY id`,
  );

  return result.rows;
}
