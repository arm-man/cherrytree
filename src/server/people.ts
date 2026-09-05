import "server-only";

import type { QueryResultRow } from "pg";

import { pool } from "@/server/db";

export interface Person {
  id: number;
  parentId: number | null;
  firstName: string;
  lastName: string;
  birthday: string;
  deathday: string | null;
  spouse: string | null;
}

type PersonRow = QueryResultRow & Person;

function validateParentRelationships(people: Person[]): void {
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const rootCount = people.filter((person) => person.parentId === null).length;

  if (rootCount !== 1) {
    throw new Error("People data must contain exactly one root Person.");
  }

  // Following every parent chain verifies that each Person reaches the one root
  // and detects cycles before relationship data is sent to the browser.
  for (const person of people) {
    const visitedIds = new Set<number>();
    let currentPerson: Person | undefined = person;

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

export async function getPeople(): Promise<Person[]> {
  const result = await pool.query<PersonRow>(
    `SELECT
       id,
       parent_id AS "parentId",
       first_name AS "firstName",
       last_name AS "lastName",
       TO_CHAR(birthday, 'YYYY-MM-DD') AS birthday,
       TO_CHAR(deathday, 'YYYY-MM-DD') AS deathday,
       spouse
     FROM people
     ORDER BY id`,
  );

  validateParentRelationships(result.rows);

  return result.rows;
}
