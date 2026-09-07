import assert from "node:assert/strict";
import test from "node:test";
import {
  hasPartnerChanges,
  PartnerValidationError,
  validatePartner,
} from "./partner-validation.ts";

const people = [{ id: 1 }, { id: 2 }];
const today = "2026-09-07";
const valid = { firstName: " Pat ", lastName: " Cherry ", partnerId: 1 };

function rejects(input: unknown, code: string): void {
  assert.throws(
    () => validatePartner(input, people, today),
    (error: unknown) =>
      error instanceof PartnerValidationError && error.code === code,
  );
}

test("Spouse names and association are required; only existing Cherry Kin ids are accepted", () => {
  for (const input of [
    null,
    [],
    {},
    { ...valid, id: 1 },
    { ...valid, firstName: " " },
    { ...valid, lastName: 1 },
    { ...valid, partnerId: null },
  ])
    rejects(input, "REQUIRED_FIELD_MISSING");
  for (const partnerId of [0, -1, 3, "1", 1.5, 2147483648])
    rejects({ ...valid, partnerId }, "INVALID_PARTNER");
});

test("Spouse optional dates normalize to null and names are trimmed", () => {
  for (const empty of [undefined, null, "", "  "]) {
    assert.deepEqual(
      validatePartner(
        { ...valid, birthday: empty, deathday: empty },
        people,
        today,
      ),
      {
        firstName: "Pat",
        lastName: "Cherry",
        partnerId: 1,
        birthday: null,
        deathday: null,
      },
    );
  }
});

test("Spouse date validation requires Birthday for Death Day and retains existing date rules", () => {
  rejects({ ...valid, deathday: today }, "INVALID_DEATHDAY");
  rejects(
    { ...valid, birthday: "2000-01-01", deathday: "1999-12-31" },
    "INVALID_DEATHDAY",
  );
  for (const invalid of [
    "2026-09-08",
    "2026-02-29",
    "2026-04-31",
    "2026-01-01T00:00:00Z",
    false,
    {},
    20000101,
  ]) {
    rejects({ ...valid, birthday: invalid }, "INVALID_BIRTHDAY");
    rejects(
      { ...valid, birthday: "1970-01-01", deathday: invalid },
      "INVALID_DEATHDAY",
    );
  }
  assert.equal(
    validatePartner(
      { ...valid, birthday: today, deathday: today },
      people,
      today,
    ).deathday,
    today,
  );
  assert.equal(
    validatePartner({ ...valid, birthday: today }, people, today).deathday,
    null,
  );
});

test("Spouse edits detect reassignment, clearing dates and each other editable field", () => {
  const stored = validatePartner(
    { ...valid, birthday: "1970-01-01", deathday: today },
    people,
    today,
  );
  assert.equal(
    hasPartnerChanges(
      { ...stored, firstName: "Pat" },
      { ...stored, firstName: " Pat " },
    ),
    false,
  );
  for (const change of [
    { firstName: "Alex" },
    { lastName: "Arant" },
    { birthday: null },
    { deathday: null },
    { partnerId: 2 },
  ]) {
    assert.equal(hasPartnerChanges({ ...stored, ...change }, stored), true);
  }
});
