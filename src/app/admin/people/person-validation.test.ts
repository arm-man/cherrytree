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
import type { Person } from "@/server/people";

const today = "2026-09-05";
const root: Person = {
  id: 1,
  firstName: "Virginia",
  lastName: "Cherry",
  birthday: "1947-05-17",
  deathday: "2020-01-01",
  spouse: null,
  parentId: null,
};
const child: Person = {
  ...root,
  id: 2,
  firstName: "Amy",
  birthday: "1962-05-17",
  deathday: null,
  parentId: 1,
};
const grandchild: Person = {
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
  spouse: "  ",
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
    spouse: null,
    parentId: 1,
  });
  assert.equal(
    validatePerson({ ...valid, spouse: " Pat " }, people, today).spouse,
    "Pat",
  );
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
    { ...valid, spouse: {} },
    { ...valid, birthday: null },
    { ...valid, parentId: null },
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
      spouse: " Pat ",
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
    { spouse: null },
    { parentId: 3 },
  ])
    assert.equal(hasPersonChanges({ ...values, ...change }, stored), true);
});
