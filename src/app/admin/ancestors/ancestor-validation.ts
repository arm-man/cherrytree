import { isValidDateOnly } from "../people/person-validation.ts";

export interface AncestorValues {
  firstName: string;
  lastName: string;
  birthday: string;
  deathday: string | null;
  spouse: string | null;
}

export interface AdminAncestor extends AncestorValues {
  id: number;
}

type AncestorErrorCode =
  | "REQUIRED_FIELD_MISSING"
  | "INVALID_BIRTHDAY"
  | "INVALID_DEATHDAY"
  | "ANCESTOR_NOT_FOUND"
  | "NO_CHANGES";

export class AncestorValidationError extends Error {
  readonly code: AncestorErrorCode;
  readonly field?: keyof AncestorValues;
  constructor(
    code: AncestorErrorCode,
    message: string,
    field?: keyof AncestorValues,
  ) {
    super(message);
    this.name = "AncestorValidationError";
    this.code = code;
    this.field = field;
  }
}

export function validateAncestor(
  input: unknown,
  today: string,
): AncestorValues {
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input) ||
    "id" in input
  ) {
    throw new AncestorValidationError(
      "REQUIRED_FIELD_MISSING",
      "Enter editable Ancestor details as a JSON object.",
    );
  }
  if (
    !("firstName" in input) ||
    typeof input.firstName !== "string" ||
    !input.firstName.trim()
  ) {
    throw new AncestorValidationError(
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
    throw new AncestorValidationError(
      "REQUIRED_FIELD_MISSING",
      "Enter a Last Name.",
      "lastName",
    );
  }
  const birthday = optionalDate("birthday" in input ? input.birthday : null);
  const deathday = optionalDate("deathday" in input ? input.deathday : null);
  if (
    typeof birthday !== "string" ||
    !isValidDateOnly(birthday) ||
    birthday > today
  ) {
    throw new AncestorValidationError(
      "INVALID_BIRTHDAY",
      "Enter a valid Birthday that is not in the future.",
      "birthday",
    );
  }
  if (
    deathday !== null &&
    (typeof deathday !== "string" ||
      !isValidDateOnly(deathday) ||
      deathday < birthday ||
      deathday > today)
  ) {
    throw new AncestorValidationError(
      "INVALID_DEATHDAY",
      "Enter a valid Death Day on or after Birthday and not in the future.",
      "deathday",
    );
  }
  const spouse = "spouse" in input ? input.spouse : null;
  if (spouse != null && typeof spouse !== "string") {
    throw new AncestorValidationError(
      "REQUIRED_FIELD_MISSING",
      "Enter Spouse as text or leave it blank.",
      "spouse",
    );
  }
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    birthday,
    deathday,
    spouse: spouse?.trim() || null,
  };
}

function optionalDate(value: unknown): unknown {
  return value == null || (typeof value === "string" && !value.trim())
    ? null
    : value;
}

export function hasAncestorChanges(
  values: AncestorValues,
  stored: AncestorValues,
): boolean {
  return (
    values.firstName !== stored.firstName.trim() ||
    values.lastName !== stored.lastName.trim() ||
    values.birthday !== stored.birthday ||
    values.deathday !== stored.deathday ||
    values.spouse !== (stored.spouse?.trim() || null)
  );
}
