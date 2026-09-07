import assert from "node:assert/strict";
import test from "node:test";

import { calculateAge, formatAge } from "./date-calculations.ts";
import {
  filterPeopleBySearch,
  getGenealogyGenerations,
  SORT_OPTIONS,
  sortPeople,
} from "./people-calculations.ts";
import {
  getListRows,
  getParentSection,
  getPublicRows,
} from "./public-display.ts";
import type { PublicPartner, PublicPerson } from "./public-display.ts";

const people: PublicPerson[] = [
  {
    id: 1,
    parentId: null,
    firstName: "Zelda",
    lastName: "Cherry",
    birthday: "1940-12-31",
    deathday: "2020-05-01",
    phoneNumber: "7035551212",
  },
  {
    id: 2,
    parentId: 1,
    firstName: "Amy",
    lastName: "Young",
    birthday: "1970-01-02",
    deathday: null,
    phoneNumber: "7035551234",
  },
  {
    id: 3,
    parentId: 2,
    firstName: "Ben",
    lastName: "Young",
    birthday: "1995-06-15",
    deathday: null,
    phoneNumber: null,
  },
  {
    id: 4,
    parentId: 3,
    firstName: "Cora",
    lastName: "Young",
    birthday: "2015-06-15",
    deathday: null,
    phoneNumber: null,
  },
  {
    id: 5,
    parentId: 4,
    firstName: "Dora",
    lastName: "Young",
    birthday: "2035-06-15",
    deathday: null,
    phoneNumber: null,
  },
];

const partners: PublicPartner[] = [
  {
    id: 1,
    partnerId: 1,
    firstName: "Aaron",
    lastName: "Cherry",
    birthday: "1938-12-30",
    deathday: "2010-03-01",
  },
  {
    id: 2,
    partnerId: 1,
    firstName: "Unknown",
    lastName: "Birthday",
    birthday: null,
    deathday: null,
  },
  // Matching names and overlapping entity IDs must never merge rows.
  {
    id: 3,
    partnerId: 2,
    firstName: "Amy",
    lastName: "Young",
    birthday: "1972-01-01",
    deathday: null,
  },
  {
    id: 4,
    partnerId: 3,
    firstName: "Amy",
    lastName: "Young",
    birthday: "1973-01-01",
    deathday: null,
  },
];

test("builds separate rows with ID associations, comma-separated spouses and no inherited phone", () => {
  const rows = getPublicRows(people, partners);
  assert.equal(rows.people.length, people.length);
  assert.equal(rows.partners.length, partners.length);
  assert.equal(rows.people[0].spouse, "Aaron Cherry, Unknown Birthday");
  assert.equal(rows.people[3].spouse, null);
  assert.equal(rows.people[0].phoneNumber, "7035551212");
  assert.deepEqual(
    rows.people.map((person) => person.childCount),
    [1, 1, 1, 1, 0],
  );
  assert.equal(
    new Set([...rows.people, ...rows.partners].map((row) => row.rowKey)).size,
    9,
  );
  assert.deepEqual(
    rows.partners.map((partner) => partner.spouse),
    ["Zelda Cherry", "Zelda Cherry", "Amy Young", "Ben Young"],
  );
  assert.deepEqual(
    rows.partners.map((partner) => partner.navigationPersonId),
    [1, 1, 2, 3],
  );
  assert.deepEqual(
    rows.partners.map((partner) => partner.childCount),
    [null, null, 1, 1],
  );
  for (const partner of rows.partners) {
    assert.equal("phoneNumber" in partner, false);
    assert.equal("parentId" in partner, false);
  }
});

test("sole partners inherit the associated child count, including zero and unknown birthdays", () => {
  const rows = getPublicRows(people, [
    { ...partners[1], id: 90, partnerId: 1 },
    { ...partners[1], id: 91, partnerId: 5 },
  ]);
  assert.deepEqual(
    rows.partners.map((partner) => partner.childCount),
    [1, 0],
  );
  assert.ok(rows.partners.every((partner) => partner.birthday === null));
  const sorted = sortPeople(
    getListRows(rows.people, rows.partners),
    "Children",
    "2026-12-30",
  );
  assert.deepEqual(
    sorted.map((row) => row.childCount),
    [1, 1, 1, 1, 1, 0, 0],
  );
});

test("all partner records count toward the association even with duplicate names or filtered results", () => {
  const rows = getPublicRows(people, [
    partners[0],
    { ...partners[0], id: 99, birthday: null, deathday: null },
    { ...partners[1], id: 100 },
  ]);
  assert.ok(rows.partners.every((partner) => partner.childCount === null));
  const filtered = filterPeopleBySearch(
    getListRows(rows.people, rows.partners),
    "unknown",
  );
  const visiblePartners = filtered.filter((row) => row.type === "partner");
  assert.equal(visiblePartners.length, 1);
  assert.equal(visiblePartners[0].childCount, null);
});

test("ignores legacy spouse values even when supplied by an old caller", () => {
  const rows = getPublicRows(
    people.map((person) => ({ ...person, spouse: "Legacy Name" })),
    [],
  );
  assert.ok(rows.people.every((person) => person.spouse === null));
  assert.deepEqual(filterPeopleBySearch(rows.people, "Legacy"), []);
});

test("Parent section includes zero, one or multiple partners, including unknown birthdays", () => {
  for (const count of [0, 1, 2]) {
    const selected = count === 1 ? [partners[1]] : partners.slice(0, count);
    const rows = getPublicRows(people, selected);
    const section = getParentSection(rows.people[0], rows.partners);
    assert.equal(
      section.title,
      ["Parent", "Parents", "Parent & Spouses"][count],
    );
    assert.equal(section.rows.length, count + 1);
    assert.equal(section.rows[0].rowKey, "person-1");
    assert.ok(section.rows.every((row) => row.navigationPersonId === 1));
    if (count > 0) {
      assert.equal(section.rows.at(-1)?.birthday, null);
    }
  }
});

test("partners never enter any of the four descendant generations", () => {
  const rows = getPublicRows(people, partners);
  const generations = getGenealogyGenerations(rows.people, 1);
  assert.deepEqual(
    [
      generations.children,
      generations.grandchildren,
      generations.greatGrandchildren,
      generations.greatGreatGrandchildren,
    ].map((generation) => generation.map((row) => row.rowKey)),
    [["person-2"], ["person-3"], ["person-4"], ["person-5"]],
  );
  assert.deepEqual(
    getParentSection(rows.people[1], rows.partners).rows.map(
      (row) => row.rowKey,
    ),
    ["person-2", "partner-3"],
  );
});

test("List includes every person and partner, retaining unknown birthdays and duplicate names", () => {
  const rows = getPublicRows(people, partners);
  const list = getListRows(rows.people, rows.partners);
  assert.deepEqual(
    list.map((row) => row.rowKey),
    [
      "person-1",
      "person-2",
      "person-3",
      "person-4",
      "person-5",
      "partner-1",
      "partner-2",
      "partner-3",
      "partner-4",
    ],
  );
  assert.equal(list.filter((row) => row.firstName === "Amy").length, 3);
  assert.deepEqual(
    filterPeopleBySearch(list, "  AARON ").map((row) => row.rowKey),
    ["person-1", "partner-1"],
  );
  assert.deepEqual(
    filterPeopleBySearch(list, " ZELDA ").map((row) => row.rowKey),
    ["person-1", "partner-1", "partner-2"],
  );
  assert.equal(list.length, people.length + partners.length);
  assert.deepEqual(
    filterPeopleBySearch(list, "unknown").map((row) => row.rowKey),
    ["person-1", "partner-2"],
  );
  assert.deepEqual(filterPeopleBySearch(list, "1972"), []);
  assert.deepEqual(filterPeopleBySearch(list, "December"), []);
  assert.deepEqual(filterPeopleBySearch(list, "   "), list);
});

test("partners participate in all existing sorts and blank children follow zero", () => {
  const rows = getPublicRows(people.slice(0, 2), partners.slice(0, 3));
  const list = getListRows(rows.people, rows.partners);
  const keysFor = (sort: Parameters<typeof sortPeople>[1]) =>
    sortPeople(list, sort, "2026-12-30").map((row) => row.rowKey);
  assert.deepEqual(keysFor("Birthday"), [
    "partner-1",
    "person-1",
    "person-2",
    "partner-3",
    "partner-2",
  ]);
  assert.deepEqual(keysFor("Upcoming Birthday"), [
    "partner-1",
    "person-1",
    "partner-3",
    "person-2",
    "partner-2",
  ]);
  assert.deepEqual(keysFor("Death Day"), ["partner-1", "person-1"]);
  assert.deepEqual(keysFor("First Name"), [
    "partner-1",
    "person-2",
    "partner-3",
    "partner-2",
    "person-1",
  ]);
  assert.deepEqual(keysFor("Last Name"), [
    "partner-2",
    "partner-1",
    "person-1",
    "person-2",
    "partner-3",
  ]);
  assert.deepEqual(keysFor("Spouse"), [
    "person-1",
    "person-2",
    "partner-3",
    "partner-1",
    "partner-2",
  ]);
  assert.deepEqual(keysFor("Children"), [
    "person-1",
    "person-2",
    "partner-3",
    "partner-1",
    "partner-2",
  ]);
});

test("only Death Day omits null death days, and no sort mutates the source List", () => {
  const rows = getPublicRows(people, partners);
  const list = getListRows(rows.people, rows.partners);
  const originalKeys = list.map((row) => row.rowKey);
  for (const option of SORT_OPTIONS) {
    const sorted = sortPeople(list, option, "2026-12-30");
    const expectedKeys =
      option === "Death Day" ? ["person-1", "partner-1"] : originalKeys;
    assert.equal(sorted.length, expectedKeys.length);
    assert.deepEqual(
      new Set(sorted.map((row) => row.rowKey)),
      new Set(expectedKeys),
    );
    assert.deepEqual(
      list.map((row) => row.rowKey),
      originalKeys,
    );
  }
});

test("Death Day produces no rows when all matching Cherry Kin and partners have null death days", () => {
  const rows = getPublicRows(people, partners);
  const list = getListRows(rows.people, rows.partners);
  const matches = filterPeopleBySearch(list, "Amy");
  assert.ok(matches.some((row) => row.type === "cherryKin"));
  assert.ok(matches.some((row) => row.type === "partner"));
  assert.deepEqual(sortPeople(matches, "Death Day", "2026-12-30"), []);
});

test("missing birthdays sort after real dates without interpreting blank as a date", () => {
  const rows = getPublicRows(people, partners);
  const all = [...rows.partners, ...rows.people];
  for (const sort of ["Birthday", "Upcoming Birthday"] as const) {
    assert.equal(
      sortPeople(all, sort, "2026-12-30").at(-1)?.rowKey,
      "partner-2",
    );
  }
});

test("partner death dates and birthdays feed the existing age and popup calculations", () => {
  const { partners: rows } = getPublicRows(people, partners);
  const partner = rows[0];
  assert.ok(partner.birthday && partner.deathday);
  assert.equal(
    formatAge(partner.birthday, partner.deathday, "2026-12-30"),
    "71 †",
  );
  assert.equal(calculateAge(partner.birthday, "2026-12-30"), 88);
  assert.equal(partner.deathday, "2010-03-01");
});
