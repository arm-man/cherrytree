import assert from "node:assert/strict";
import test from "node:test";
import {
  adminPeopleUrl,
  filterAdminRows,
  parseAdminRowFilter,
} from "./admin-display.ts";
import type { AdminListRow } from "./admin-display.ts";

const kin: AdminListRow = {
  id: 1,
  type: "cherryKin",
  fullName: "Candee Arant",
  birthday: "Dec 14, 1975",
  deathday: "Mar 2, 2008",
  parentName: "Virginia Cherry",
  phoneNumber: "(703) 555-1234",
  spouseName: "",
};
const spouse: AdminListRow = {
  id: 1,
  type: "spouse",
  fullName: "Herschel Smith",
  birthday: "Jan 3, 1970",
  deathday: "Feb 4, 2009",
  parentName: "",
  phoneNumber: "",
  spouseName: "Candee Arant",
};
const rows = [kin, spouse];

test("All is the default and each type combines with trimmed case-insensitive search", () => {
  for (const value of [null, undefined, "", "invalid", ["spouse"]])
    assert.equal(parseAdminRowFilter(value), "all");
  assert.deepEqual(filterAdminRows(rows, "", "all"), rows);
  assert.deepEqual(filterAdminRows(rows, "", "cherryKin"), [kin]);
  assert.deepEqual(filterAdminRows(rows, "", "spouse"), [spouse]);
  assert.deepEqual(filterAdminRows(rows, "  ARANT  ", "spouse"), [spouse]);
  assert.deepEqual(filterAdminRows(rows, "Herschel", "cherryKin"), []);
});

test("every displayed field is searchable", () => {
  for (const row of rows) {
    for (const value of [
      row.fullName,
      row.birthday,
      row.deathday,
      row.parentName,
      row.phoneNumber,
      row.spouseName,
    ].filter(Boolean)) {
      assert.ok(filterAdminRows(rows, value, row.type).includes(row), value);
    }
  }
});

test("admin navigation preserves both filters and safely encodes search text", () => {
  assert.equal(
    adminPeopleUrl("/admin/partners/1/edit", "Arant & Cherry", "spouse"),
    "/admin/partners/1/edit?search=Arant+%26+Cherry&type=spouse",
  );
  assert.equal(adminPeopleUrl("/admin/people", "", "all"), "/admin/people");
});
