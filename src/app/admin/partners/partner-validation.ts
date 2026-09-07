import { isValidDateOnly } from "../people/person-validation.ts";

export interface PartnerValues {
  firstName: string;
  lastName: string;
  birthday: string | null;
  deathday: string | null;
  partnerId: number;
}

export interface AdminPartner extends PartnerValues {
  id: number;
}

type PartnerErrorCode =
  | "REQUIRED_FIELD_MISSING"
  | "INVALID_BIRTHDAY"
  | "INVALID_DEATHDAY"
  | "INVALID_PARTNER"
  | "PARTNER_NOT_FOUND"
  | "NO_CHANGES";

export class PartnerValidationError extends Error {
  readonly code: PartnerErrorCode;
  readonly field?: keyof PartnerValues;
  constructor(
    code: PartnerErrorCode,
    message: string,
    field?: keyof PartnerValues,
  ) {
    super(message);
    this.name = "PartnerValidationError";
    this.code = code;
    this.field = field;
  }
}

export function validatePartner(
  input: unknown,
  people: readonly { id: number }[],
  today: string,
): PartnerValues {
  if (
    typeof input !== "object" ||
    input === null ||
    Array.isArray(input) ||
    "id" in input
  ) {
    throw new PartnerValidationError(
      "REQUIRED_FIELD_MISSING",
      "Enter editable Spouse details as a JSON object.",
    );
  }
  if (
    !("firstName" in input) ||
    typeof input.firstName !== "string" ||
    !input.firstName.trim()
  ) {
    throw new PartnerValidationError(
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
    throw new PartnerValidationError(
      "REQUIRED_FIELD_MISSING",
      "Enter a Last Name.",
      "lastName",
    );
  }
  const birthday = optionalDate("birthday" in input ? input.birthday : null);
  const deathday = optionalDate("deathday" in input ? input.deathday : null);
  if (
    birthday !== null &&
    (typeof birthday !== "string" ||
      !isValidDateOnly(birthday) ||
      birthday > today)
  ) {
    throw new PartnerValidationError(
      "INVALID_BIRTHDAY",
      "Enter a valid Birthday that is not in the future.",
      "birthday",
    );
  }
  if (
    deathday !== null &&
    (typeof deathday !== "string" ||
      !isValidDateOnly(deathday) ||
      birthday === null ||
      deathday < birthday ||
      deathday > today)
  ) {
    throw new PartnerValidationError(
      "INVALID_DEATHDAY",
      "Enter Birthday and a valid Death Day on or after it and not in the future.",
      "deathday",
    );
  }
  const partnerId = "partnerId" in input ? input.partnerId : null;
  if (partnerId === null || partnerId === "") {
    throw new PartnerValidationError(
      "REQUIRED_FIELD_MISSING",
      "Select a Cherry Kin in Spouse.",
      "partnerId",
    );
  }
  if (
    typeof partnerId !== "number" ||
    !Number.isInteger(partnerId) ||
    partnerId < 1 ||
    partnerId > 2147483647 ||
    !people.some((person) => person.id === partnerId)
  ) {
    throw new PartnerValidationError(
      "INVALID_PARTNER",
      "Select an existing Cherry Kin in Spouse.",
      "partnerId",
    );
  }
  return {
    firstName: input.firstName.trim(),
    lastName: input.lastName.trim(),
    birthday,
    deathday,
    partnerId,
  };
}

function optionalDate(value: unknown): unknown {
  return value == null || (typeof value === "string" && !value.trim())
    ? null
    : value;
}

export function hasPartnerChanges(
  values: PartnerValues,
  stored: PartnerValues,
): boolean {
  return (
    values.firstName !== stored.firstName.trim() ||
    values.lastName !== stored.lastName.trim() ||
    values.birthday !== stored.birthday ||
    values.deathday !== stored.deathday ||
    values.partnerId !== stored.partnerId
  );
}
