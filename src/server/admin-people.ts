import "server-only";

import {
  getFullName,
  hasPersonChanges,
  PersonValidationError,
  sortByFullName,
  validatePerson,
} from "@/app/admin/people/person-validation";
import type { PersonValues } from "@/app/admin/people/person-validation";
import {
  getValidationDate,
  insertPerson,
  insertPersonLog,
  updatePerson,
  withPeopleTransaction,
} from "./admin-people-db";
import { logServerError } from "./db";
import { getPeople, validateParentRelationships } from "./people";
import type { Person } from "./people";

const PERSON_COLUMNS: [keyof PersonValues, string][] = [
  ["firstName", "first_name"],
  ["lastName", "last_name"],
  ["birthday", "birthday"],
  ["deathday", "deathday"],
  ["spouse", "spouse"],
  ["parentId", "parent"],
];

function formatPersonLogValue(
  person: PersonValues,
  field: keyof PersonValues,
  people: readonly Person[],
): string {
  if (field === "parentId" && person.parentId !== null) {
    const parent = people.find((candidate) => candidate.id === person.parentId);
    if (!parent) {
      throw new Error("People data references a missing parent.");
    }
    return JSON.stringify(getFullName(parent));
  }
  return JSON.stringify(person[field]);
}

export async function logPeopleError(
  context: string,
  error: unknown,
): Promise<void> {
  // Retain useful failure context without copying pg messages, which can include
  // connection details or submitted values. Graph messages are fixed application text.
  const graphMessages = [
    "People data must contain exactly one root Person.",
    "Person 1 must be the single root Person.",
    "People data contains a parent relationship cycle.",
    "People data references a missing parent.",
  ];
  let detail = "Unexpected server failure.";
  if (error instanceof Error && graphMessages.includes(error.message)) {
    detail = error.message;
  } else if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string" &&
    /^[A-Z0-9_]{2,30}$/.test(error.code)
  ) {
    detail = `Database or connection error code: ${error.code}.`;
  }
  await logServerError(`${context} ${detail}`);
}

export async function getAdminPeople(): Promise<Person[]> {
  try {
    return sortByFullName(await getPeople());
  } catch (error: unknown) {
    await logPeopleError("Failed to load administrative People data.", error);
    throw new Error("Something went wrong. Please try again.");
  }
}

export async function savePerson(
  input: unknown,
  personId?: number,
): Promise<number> {
  return withPeopleTransaction(async (client) => {
    const people = await getPeople(client);
    const stored = people.find((person) => person.id === personId);
    if (personId !== undefined && !stored) {
      throw new PersonValidationError("PERSON_NOT_FOUND", "Person not found.");
    }
    const values = validatePerson(
      input,
      people,
      await getValidationDate(client),
      personId,
    );
    if (stored && !hasPersonChanges(values, stored)) {
      throw new PersonValidationError("NO_CHANGES", "No changes were made.");
    }
    if (stored) {
      validateParentRelationships(
        people.map((person) =>
          person.id === stored.id ? { ...person, ...values } : person,
        ),
      );
      await updatePerson(client, stored.id, values);
      for (const [field, column] of PERSON_COLUMNS) {
        if (stored[field] !== values[field]) {
          await insertPersonLog(
            client,
            `Edited Person id=${stored.id}, full_name=${JSON.stringify(getFullName(stored))}: ${column} changed from ${formatPersonLogValue(stored, field, people)} to ${formatPersonLogValue(values, field, people)}.`,
          );
        }
      }
      return stored.id;
    }
    const createdId = await insertPerson(client, values);
    // Verify with the generated identity before committing, including the root invariant.
    validateParentRelationships([...people, { id: createdId, ...values }]);
    const details = PERSON_COLUMNS.filter(
      ([field]) => values[field] !== null && values[field] !== "",
    ).map(
      ([field, column]) =>
        `${column}=${formatPersonLogValue(values, field, people)}`,
    );
    await insertPersonLog(
      client,
      `Added Person id=${createdId}: ${details.join(", ")}.`,
    );
    return createdId;
  });
}
