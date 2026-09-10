import assert from "node:assert/strict";
import test from "node:test";
import {
  AncestorValidationError,
  hasAncestorChanges,
  validateAncestor,
} from "./ancestor-validation.ts";

const today = "2026-09-10";
const values = {
  firstName: "Ada",
  lastName: "Cherry",
  birthday: "1900-01-01",
  deathday: null,
  spouse: null,
};

test("Ancestor names and birthday are required; optional text and dates normalize", () => {
  assert.deepEqual(
    validateAncestor(
      {
        firstName: " Ada ",
        lastName: " Cherry ",
        birthday: values.birthday,
      },
      today,
    ),
    values,
  );
  for (const blank of [undefined, null, "", "   "]) {
    assert.deepEqual(
      validateAncestor({ ...values, deathday: blank, spouse: blank }, today),
      values,
    );
    for (const field of ["firstName", "lastName", "birthday"]) {
      assert.throws(
        () => validateAncestor({ ...values, [field]: blank }, today),
        (error: unknown) =>
          error instanceof AncestorValidationError && error.field === field,
      );
    }
  }
  assert.equal(
    validateAncestor({ ...values, spouse: " A plain text name " }, today)
      .spouse,
    "A plain text name",
  );
  assert.throws(
    () => validateAncestor({ ...values, spouse: 10 }, today),
    AncestorValidationError,
  );
  for (const input of [null, [], "Ada", { ...values, id: 1 }]) {
    assert.throws(
      () => validateAncestor(input, today),
      AncestorValidationError,
    );
  }
});

test("Ancestor date validation uses real calendar dates and allows equal dates", () => {
  for (const birthday of ["1900-02-29", "2026-09-11", "1900-13-01", 1900]) {
    assert.throws(
      () => validateAncestor({ ...values, birthday }, today),
      (error: unknown) =>
        error instanceof AncestorValidationError &&
        error.code === "INVALID_BIRTHDAY",
    );
  }
  for (const deathday of ["1899-12-31", "2026-09-11", "2000-02-30", true]) {
    assert.throws(
      () => validateAncestor({ ...values, deathday }, today),
      (error: unknown) =>
        error instanceof AncestorValidationError &&
        error.code === "INVALID_DEATHDAY",
    );
  }
  assert.equal(
    validateAncestor({ ...values, deathday: values.birthday }, today).deathday,
    values.birthday,
  );
  assert.equal(
    validateAncestor({ ...values, birthday: today }, today).birthday,
    today,
  );
});

test("Ancestor edits detect every editable field and clearing optional values", () => {
  assert.equal(hasAncestorChanges(values, values), false);
  assert.equal(
    hasAncestorChanges(values, { ...values, firstName: " Ada ", spouse: " " }),
    false,
  );
  for (const changes of [
    { firstName: "Anne" },
    { lastName: "Elder" },
    { birthday: "1900-01-02" },
    { deathday: "1980-01-01" },
    { spouse: "Sam" },
  ]) {
    assert.equal(hasAncestorChanges({ ...values, ...changes }, values), true);
    assert.equal(hasAncestorChanges(values, { ...values, ...changes }), true);
  }
});
