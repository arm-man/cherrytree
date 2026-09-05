import assert from "node:assert/strict";
import test from "node:test";

import {
  calculateAge,
  formatAge,
  getDaysUntilNextBirthday,
  isUpcomingBirthday,
} from "./date-calculations.ts";

test("calculates current age before, on, and after the birthday", () => {
  assert.equal(calculateAge("2000-09-05", "2026-09-04"), 25);
  assert.equal(calculateAge("2000-09-05", "2026-09-05"), 26);
  assert.equal(calculateAge("2000-09-05", "2026-09-06"), 26);
});

test("formats a living person's current age", () => {
  assert.equal(formatAge("2000-09-05", null, "2026-09-04"), "25");
});

test("formats age at death with a dagger", () => {
  assert.equal(formatAge("1924-05-17", "2012-04-30", "2026-09-04"), "87 †");
});

test("age at death uses the full date and stays fixed as today changes", () => {
  assert.equal(formatAge("1924-05-17", "2012-05-16", "2026-05-16"), "87 †");
  assert.equal(formatAge("1924-05-17", "2012-05-17", "2026-05-17"), "88 †");
  assert.equal(formatAge("1924-05-17", "2012-05-18", "2027-05-17"), "88 †");
  assert.equal(calculateAge("1924-05-17", "2026-05-16"), 101);
  assert.equal(calculateAge("1924-05-17", "2026-05-17"), 102);
  assert.equal(formatAge("2000-12-31", "2020-01-01", "2026-01-01"), "19 †");
});

test("calculates the next birthday including today and across years", () => {
  assert.equal(getDaysUntilNextBirthday("1980-09-05", "2026-09-05"), 0);
  assert.equal(getDaysUntilNextBirthday("1980-09-11", "2026-09-05"), 6);
  assert.equal(getDaysUntilNextBirthday("1980-01-02", "2026-12-30"), 3);
});

test("identifies birthdays in the seven-day window", () => {
  assert.equal(isUpcomingBirthday("1980-09-11", "2026-09-05"), true);
  assert.equal(isUpcomingBirthday("1980-09-12", "2026-09-05"), false);
});
