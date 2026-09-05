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

test("formats age at death followed by the age if alive today", () => {
  assert.equal(
    formatAge("1924-05-17", "2012-04-30", "2026-09-04"),
    "87 (102)",
  );
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
