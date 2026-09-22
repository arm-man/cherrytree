import assert from "node:assert/strict";
import test from "node:test";
import {
  getEligibleParents,
  hasPersonChanges,
  isEligibleParentBirthday,
  isValidDateOnly,
  PersonValidationError,
  validatePerson,
} from "./person-validation.ts";
import type { AdminPerson } from "@/server/admin-people-db";
import { formatPhoneNumber } from "./phone-number.ts";
import { formatAdminDate } from "./admin-display.ts";

const today = "2026-09-05";
const root: AdminPerson = {
  id: 1,
  firstName: "Virginia",
  lastName: "Cherry",
  birthday: "1947-05-17",
  deathday: "2020-01-01",
  phoneNumber: null,
  parentId: null,
  isStepOrAdopted: false,
};
const child: AdminPerson = {
  ...root,
  id: 2,
  firstName: "Amy",
  birthday: "1962-05-17",
  deathday: null,
  parentId: 1,
};
const grandchild: AdminPerson = {
  ...child,
  id: 3,
  firstName: "Zoe",
  birthday: "1980-01-01",
  parentId: 2,
};
const people = [root, child, grandchild];
const valid = {
  firstName: " New ",
  lastName: " Cherry ",
  birthday: "2000-01-01",
  deathday: " ",
  parentId: 1,
};

function rejects(input: unknown, code: string, personId?: number): void {
  assert.throws(
    () => validatePerson(input, people, today, personId),
    (error: unknown) =>
      error instanceof PersonValidationError && error.code === code,
  );
}

test("strict calendar validation rejects rollovers, timestamps, and invalid leap days", () => {
  for (const date of [
    "2026-02-29",
    "1900-02-29",
    "2026-04-31",
    "2026-00-01",
    "2026-13-01",
    "0000-01-01",
    "26-01-01",
    "2026-01-01T00:00:00Z",
    " 2026-01-01",
  ])
    assert.equal(isValidDateOnly(date), false, date);
  for (const date of ["2000-02-29", "2024-02-29", "0001-01-01", "2026-09-05"])
    assert.equal(isValidDateOnly(date), true, date);
});

test("normalizes names and blank optional fields while retaining date-only strings", () => {
  assert.deepEqual(validatePerson(valid, people, today), {
    firstName: "New",
    lastName: "Cherry",
    birthday: "2000-01-01",
    deathday: null,
    phoneNumber: null,
    parentId: 1,
    isStepOrAdopted: false,
  });
});

test("rejects malformed bodies, missing fields and wrong field types", () => {
  for (const input of [
    null,
    [],
    "text",
    {},
    { ...valid, id: 99 },
    { ...valid, firstName: " " },
    { ...valid, lastName: 2 },
    { ...valid, birthday: null },
    { ...valid, parentId: null },
    { ...valid, isStepOrAdopted: "yes" },
  ])
    rejects(input, "REQUIRED_FIELD_MISSING");
  rejects({ ...valid, birthday: 20000101 }, "INVALID_BIRTHDAY");
  rejects({ ...valid, deathday: false }, "INVALID_DEATHDAY");
  for (const parentId of ["1", 1.5, -1, 2147483648, 99])
    rejects({ ...valid, parentId }, "INVALID_PARENT");
});

test("Birthday and Death Day use supplied today, including the current day", () => {
  rejects({ ...valid, birthday: "2026-09-06" }, "INVALID_BIRTHDAY");
  rejects({ ...valid, deathday: "2026-09-06" }, "INVALID_DEATHDAY");
  rejects({ ...valid, deathday: "1999-12-31" }, "INVALID_DEATHDAY");
  assert.equal(
    validatePerson(
      { ...valid, birthday: today, deathday: today },
      people,
      today,
    ).deathday,
    today,
  );
  assert.equal(
    validatePerson({ ...valid, birthday: "2026-09-06" }, people, "2026-09-06")
      .birthday,
    "2026-09-06",
  );
});

test("Parent eligibility includes exactly 15 years and excludes a one-day shortfall", () => {
  assert.equal(isEligibleParentBirthday("1947-05-17", "1962-05-17"), true);
  assert.equal(isEligibleParentBirthday("1947-05-17", "1962-05-16"), false);
  rejects({ ...valid, birthday: "1962-05-16" }, "PARENT_TOO_YOUNG");
  assert.equal(
    validatePerson({ ...valid, birthday: "1962-05-17" }, people, today)
      .parentId,
    1,
  );
});

test("Parent eligibility ignores current age and age at death", () => {
  assert.equal(
    validatePerson({ ...valid, birthday: today }, people, today).parentId,
    1,
  );
  assert.deepEqual(
    getEligibleParents(people, "1962-05-17").map((person) => person.id),
    [1],
  );
});

test("Parent options sort Full Names and exclude self and descendants at any depth", () => {
  let parent = grandchild;
  const deepPeople = [...people];
  for (let id = 4; id <= 10; id++) {
    parent = { ...parent, id, parentId: parent.id };
    deepPeople.push(parent);
  }
  assert.deepEqual(
    getEligibleParents(deepPeople, today, 2).map((person) => person.id),
    [1],
  );
  assert.deepEqual(
    getEligibleParents(people, today).map((person) => person.id),
    [2, 1, 3],
  );
  assert.deepEqual(getEligibleParents(people, "invalid"), []);
  assert.deepEqual(getEligibleParents(people, today, 1), []);
});

test("server rejects self-parenting, descendants, and any change to the top-level Parent", () => {
  rejects({ ...valid, parentId: 2 }, "RELATIONSHIP_CYCLE", 2);
  rejects({ ...valid, parentId: 3 }, "RELATIONSHIP_CYCLE", 2);
  rejects({ ...valid, parentId: 2 }, "INVALID_PARENT", 1);
  const { id: ignoredId, ...rootValues } = root;
  void ignoredId;
  assert.equal(validatePerson(rootValues, people, today, 1).parentId, null);
});

test("normalized unchanged values compare equal, while each editable field is detected", () => {
  const stored = { ...child, spouse: "Pat" };
  const values = validatePerson(
    {
      firstName: " Amy ",
      lastName: "Cherry ",
      birthday: child.birthday,
      deathday: "",
      parentId: 1,
    },
    people,
    today,
    2,
  );
  assert.equal(hasPersonChanges(values, stored), false);
  for (const change of [
    { firstName: "Anne" },
    { lastName: "Smith" },
    { birthday: "1963-01-01" },
    { deathday: today },
    { phoneNumber: "7035551234" },
    { parentId: 3 },
    { isStepOrAdopted: true },
  ])
    assert.equal(hasPersonChanges({ ...values, ...change }, stored), true);
});

test("Step / Adopted child defaults false on create and is preserved when omitted on edit", () => {
  assert.equal(validatePerson(valid, people, today).isStepOrAdopted, false);
  const adoptedChild = { ...child, isStepOrAdopted: true };
  assert.equal(
    validatePerson(valid, [root, adoptedChild, grandchild], today, 2)
      .isStepOrAdopted,
    true,
  );
});

test("phone numbers normalize supported formatting and reject invalid digits or characters", () => {
  for (const phoneNumber of [
    "7035551234",
    "703-555-1234",
    "(703) 555-1234",
    "703 555 1234",
    "703.555.1234",
  ]) {
    const values = validatePerson({ ...valid, phoneNumber }, people, today);
    assert.equal(values.phoneNumber, "7035551234");
    assert.equal(formatPhoneNumber(values.phoneNumber), "(703) 555-1234");
  }
  for (const phoneNumber of [
    "703555123",
    "17035551234",
    "+1 (703) 555-1234",
    "7035551234x",
    "703/555/1234",
    "7035551234 ext 5",
    "()-.",
    7035551234,
    false,
    {},
  ]) {
    rejects({ ...valid, phoneNumber }, "INVALID_PHONE_NUMBER");
  }
  assert.equal(
    validatePerson({ ...valid, phoneNumber: "0000000000" }, people, today)
      .phoneNumber,
    "0000000000",
  );
});

test("optional admin values can be omitted, null, or cleared; clearing counts as a change", () => {
  const stored: AdminPerson = {
    ...child,
    phoneNumber: "7035551234",
  };
  for (const empty of [undefined, null, "", "   "]) {
    const values = validatePerson(
      {
        ...valid,
        phoneNumber: empty,
      },
      people,
      today,
    );
    assert.equal(values.phoneNumber, null);
    assert.equal(
      hasPersonChanges({ ...stored, phoneNumber: values.phoneNumber }, stored),
      true,
    );
  }
  const { id: ignoredId, ...editable } = stored;
  void ignoredId;
  const values = validatePerson(
    { ...editable, phoneNumber: "(703) 555-1234" },
    people,
    today,
    stored.id,
  );
  assert.equal(hasPersonChanges(values, stored), false);
});

test("admin display abbreviates months and leaves absent values blank", () => {
  assert.equal(formatAdminDate("1975-12-14"), "Dec 14, 1975");
  assert.equal(formatAdminDate("2008-03-02"), "Mar 2, 2008");
  assert.equal(formatAdminDate(null), "");
  assert.equal(formatPhoneNumber(null), "");
});

test("Cherry Kin validation returns only current editable people fields", () => {
  const values = validatePerson(valid, people, today);
  assert.deepEqual(Object.keys(values).sort(), [
    "birthday",
    "deathday",
    "firstName",
    "isStepOrAdopted",
    "lastName",
    "parentId",
    "phoneNumber",
  ]);
});
