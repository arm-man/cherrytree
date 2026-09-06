import type { Person } from "@/server/people";
import type { AdminPerson } from "@/server/admin-people-db";
import { isValidPhoneNumber, normalizePhoneNumber } from "./phone-number.ts";

export interface PersonValues {
  firstName: string;
  lastName: string;
  birthday: string;
  deathday: string | null;
  spouse: string | null;
  phoneNumber: string | null;
  spouseBirthday: string | null;
  spouseDeathday: string | null;
  parentId: number | null;
}

export type PersonErrorCode =
  | "REQUIRED_FIELD_MISSING"
  | "INVALID_BIRTHDAY"
  | "INVALID_DEATHDAY"
  | "INVALID_PHONE_NUMBER"
  | "INVALID_SPOUSE_BIRTHDAY"
  | "INVALID_SPOUSE_DEATHDAY"
  | "INVALID_PARENT"
  | "PARENT_TOO_YOUNG"
  | "RELATIONSHIP_CYCLE"
  | "NO_CHANGES"
  | "PERSON_NOT_FOUND";

export class PersonValidationError extends Error {
  readonly code: PersonErrorCode;
  readonly field?: keyof PersonValues;

  constructor(
    code: PersonErrorCode,
    message: string,
    field?: keyof PersonValues,
  ) {
    super(message);
    this.name = "PersonValidationError";
    this.code = code;
    this.field = field;
  }
}

export function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const leapYear = year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
  const days = [31, leapYear ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  return (
    year >= 1 && month >= 1 && month <= 12 && day >= 1 && day <= days[month - 1]
  );
}

export function isEligibleParentBirthday(
  parentBirthday: string,
  birthday: string,
): boolean {
  if (!isValidDateOnly(birthday) || !isValidDateOnly(parentBirthday))
    return false;
  const [year, month, day] = birthday.split("-").map(Number);
  const cutoffYear = year - 15;
  if (cutoffYear < 1) return false;
  // Calendar subtraction clamps February 29 to February 28 in a non-leap year.
  const cutoffDay = month === 2 && day === 29 ? 28 : day;
  const cutoff = `${String(cutoffYear).padStart(4, "0")}-${String(month).padStart(2, "0")}-${String(cutoffDay).padStart(2, "0")}`;
  return parentBirthday <= cutoff;
}

export function getDescendantIds(
  people: readonly Person[],
  personId: number,
): Set<number> {
  const descendants = new Set<number>();
  const pending = [personId];
  while (pending.length) {
    const parentId = pending.pop();
    for (const person of people) {
      if (person.parentId === parentId && !descendants.has(person.id)) {
        descendants.add(person.id);
        pending.push(person.id);
      }
    }
  }
  return descendants;
}

export function getFullName(
  person: Pick<Person, "firstName" | "lastName">,
): string {
  return `${person.firstName} ${person.lastName}`;
}

export function sortByFullName<T extends Person>(people: readonly T[]): T[] {
  return [...people].sort((a, b) =>
    getFullName(a).localeCompare(getFullName(b), "en", { sensitivity: "base" }),
  );
}

export function getEligibleParents(
  people: readonly Person[],
  birthday: string,
  personId?: number,
): Person[] {
  if (personId === 1) return [];
  const descendants =
    personId === undefined
      ? new Set<number>()
      : getDescendantIds(people, personId);
  return sortByFullName(
    people.filter(
      (person) =>
        person.id !== personId &&
        !descendants.has(person.id) &&
        isEligibleParentBirthday(person.birthday, birthday),
    ),
  );
}

export function validatePhoneNumber(input: unknown): string | null {
  if (input == null || (typeof input === "string" && !input.trim()))
    return null;
  if (typeof input !== "string" || !isValidPhoneNumber(input)) {
    throw new PersonValidationError(
      "INVALID_PHONE_NUMBER",
      "Enter a U.S. Phone Number with exactly 10 digits, without a country code or extension.",
      "phoneNumber",
    );
  }
  return normalizePhoneNumber(input);
}

export function validateSpouseDates(
  birthday: unknown,
  deathday: unknown,
  today: string,
): Pick<PersonValues, "spouseBirthday" | "spouseDeathday"> {
  const spouseBirthday =
    typeof birthday === "string" && !birthday.trim()
      ? null
      : (birthday ?? null);
  const spouseDeathday =
    typeof deathday === "string" && !deathday.trim()
      ? null
      : (deathday ?? null);
  // Validated ISO calendar dates sort chronologically without timezone conversion.
  if (
    spouseBirthday !== null &&
    (typeof spouseBirthday !== "string" ||
      !isValidDateOnly(spouseBirthday) ||
      spouseBirthday > today)
  ) {
    throw new PersonValidationError(
      "INVALID_SPOUSE_BIRTHDAY",
      "Enter a valid Spouse's Birthday that is not in the future.",
      "spouseBirthday",
    );
  }
  if (
    spouseDeathday !== null &&
    (typeof spouseDeathday !== "string" ||
      !isValidDateOnly(spouseDeathday) ||
      spouseBirthday === null ||
      spouseDeathday < spouseBirthday ||
      spouseDeathday > today)
  ) {
    throw new PersonValidationError(
      "INVALID_SPOUSE_DEATHDAY",
      "Enter Spouse's Birthday and a valid Spouse's Death Day on or after it and not in the future.",
      "spouseDeathday",
    );
  }
  return { spouseBirthday, spouseDeathday };
}

export function validatePerson(
  input: unknown,
  people: readonly Person[],
  today: string,
  personId?: number,
): PersonValues {
  if (typeof input !== "object" || input === null || Array.isArray(input)) {
    throw new PersonValidationError(
      "REQUIRED_FIELD_MISSING",
      "Enter the Person's details as a JSON object.",
    );
  }
  if ("id" in input || "personId" in input) {
    throw new PersonValidationError(
      "REQUIRED_FIELD_MISSING",
      "The request body must contain editable Person fields only.",
    );
  }
  if (
    !("firstName" in input) ||
    typeof input.firstName !== "string" ||
    !input.firstName.trim()
  ) {
    throw new PersonValidationError(
      "REQUIRED_FIELD_MISSING",
      "Enter a First Name.",
      "firstName",
    );
  }
  if (
    !("lastName" in input) ||
    typeof input.lastName !== "string" ||
    !input.lastName.trim()
  ) {
    throw new PersonValidationError(
      "REQUIRED_FIELD_MISSING",
      "Enter a Last Name.",
      "lastName",
    );
  }
  if (
    !("birthday" in input) ||
    input.birthday === null ||
    input.birthday === ""
  ) {
    throw new PersonValidationError(
      "REQUIRED_FIELD_MISSING",
      "Enter a Birthday.",
      "birthday",
    );
  }
  if (
    typeof input.birthday !== "string" ||
    !isValidDateOnly(input.birthday) ||
    input.birthday > today
  ) {
    throw new PersonValidationError(
      "INVALID_BIRTHDAY",
      "Enter a valid Birthday that is not in the future.",
      "birthday",
    );
  }
  const deathday = "deathday" in input ? input.deathday : null;
  if (
    deathday != null &&
    (typeof deathday !== "string" ||
      (deathday.trim() !== "" &&
        (!isValidDateOnly(deathday) ||
          deathday < input.birthday ||
          deathday > today)))
  ) {
    throw new PersonValidationError(
      "INVALID_DEATHDAY",
      "Enter a valid Death Day on or after Birthday and not in the future.",
      "deathday",
    );
  }
  const phoneNumber = validatePhoneNumber(
    "phoneNumber" in input ? input.phoneNumber : null,
  );
  const spouseDates = validateSpouseDates(
    "spouseBirthday" in input ? input.spouseBirthday : null,
    "spouseDeathday" in input ? input.spouseDeathday : null,
    today,
  );
  const spouse = "spouse" in input ? input.spouse : null;
  if (spouse != null && typeof spouse !== "string") {
    throw new PersonValidationError(
      "REQUIRED_FIELD_MISSING",
      "Enter Spouse as text or leave it blank.",
      "spouse",
    );
  }
  const parentId = "parentId" in input ? input.parentId : undefined;
  if (personId === 1) {
    if (parentId !== null) {
      throw new PersonValidationError(
        "INVALID_PARENT",
        "This Person must have no Parent.",
        "parentId",
      );
    }
  } else {
    if (parentId === null || parentId === undefined || parentId === "") {
      throw new PersonValidationError(
        "REQUIRED_FIELD_MISSING",
        "Select a Parent.",
        "parentId",
      );
    }
    if (
      typeof parentId !== "number" ||
      !Number.isInteger(parentId) ||
      parentId < 1 ||
      parentId > 2147483647
    ) {
      throw new PersonValidationError(
        "INVALID_PARENT",
        "Select a valid Parent.",
        "parentId",
      );
    }
    const parent = people.find((person) => person.id === parentId);
    if (!parent) {
      throw new PersonValidationError(
        "INVALID_PARENT",
        "The selected Parent no longer exists.",
        "parentId",
      );
    }
    if (
      personId !== undefined &&
      (parentId === personId ||
        getDescendantIds(people, personId).has(parentId))
    ) {
      throw new PersonValidationError(
        "RELATIONSHIP_CYCLE",
        "A Person or their descendant cannot be their Parent.",
        "parentId",
      );
    }
    if (!isEligibleParentBirthday(parent.birthday, input.birthday)) {
      throw new PersonValidationError(
        "PARENT_TOO_YOUNG",
        "Parent must have been at least 15 years old on Birthday.",
        "parentId",
      );
    }
  }
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    birthday: input.birthday,
    deathday: typeof deathday === "string" ? deathday.trim() || null : null,
    spouse: typeof spouse === "string" ? spouse.trim() || null : null,
    phoneNumber,
    ...spouseDates,
    parentId: typeof parentId === "number" ? parentId : null,
  };
}

export function hasPersonChanges(
  values: PersonValues,
  stored: AdminPerson,
): boolean {
  return (
    values.firstName !== stored.firstName.trim() ||
    values.lastName !== stored.lastName.trim() ||
    values.birthday !== stored.birthday ||
    values.deathday !== (stored.deathday?.trim() || null) ||
    values.spouse !== (stored.spouse?.trim() || null) ||
    values.phoneNumber !== stored.phoneNumber ||
    values.spouseBirthday !== stored.spouseBirthday ||
    values.spouseDeathday !== stored.spouseDeathday ||
    values.parentId !== stored.parentId
  );
}
