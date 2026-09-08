import assert from "node:assert/strict";
import test from "node:test";

import {
  filterPeopleBySearch,
  getChildCounts,
  getGenealogyGenerations,
  personMatchesSearch,
  sortPeople,
} from "./people-calculations.ts";

const people = [
  {
    id: 1,
    parentId: null,
    firstName: "Zelda",
    lastName: "Cherry",
    birthday: "1940-12-31",
    deathday: "2020-05-01",
    spouse: "Aaron Cherry",
    childCount: 2,
  },
  {
    id: 2,
    parentId: 1,
    firstName: "Amy",
    lastName: "Young",
    birthday: "1970-01-02",
    deathday: null,
    spouse: null,
    childCount: 0,
  },
  {
    id: 3,
    parentId: 1,
    firstName: "Amy",
    lastName: "Able",
    birthday: "1965-06-15",
    deathday: "2010-03-01",
    spouse: "Zed Able",
    childCount: 0,
  },
];

test("counts children from parent relationships", () => {
  const childCounts = getChildCounts([
    { id: 1, parentId: null },
    { id: 2, parentId: 1 },
    { id: 3, parentId: 1 },
    { id: 4, parentId: 2 },
  ]);

  assert.equal(childCounts.get(1), 2);
  assert.equal(childCounts.get(2), 1);
  assert.equal(childCounts.get(3), 0);
  assert.equal(childCounts.get(4), 0);
});

test("groups four generations and orders descendants by parent and birthday", () => {
  const genealogyPeople = [
    { id: 1, parentId: null, birthday: "1917-11-30" },
    { id: 2, parentId: 1, birthday: "1940-01-01" },
    { id: 3, parentId: 1, birthday: "1938-01-01" },
    { id: 4, parentId: 2, birthday: "1965-01-01" },
    { id: 5, parentId: 3, birthday: "1970-01-01" },
    { id: 6, parentId: 3, birthday: "1960-01-01" },
    { id: 7, parentId: 6, birthday: "1985-01-01" },
    { id: 8, parentId: 7, birthday: "2010-01-01" },
    { id: 9, parentId: 8, birthday: "2030-01-01" },
  ];

  const generations = getGenealogyGenerations(genealogyPeople, 1);

  assert.deepEqual(
    generations.children.map((person) => person.id),
    [3, 2],
  );
  assert.deepEqual(
    generations.grandchildren.map((person) => person.id),
    [6, 5, 4],
  );
  assert.deepEqual(
    generations.greatGrandchildren.map((person) => person.id),
    [7],
  );
  assert.deepEqual(
    generations.greatGreatGrandchildren.map((person) => person.id),
    [8],
  );
});

test("matches and filters partial names or spouses without regard to case or padding", () => {
  assert.equal(personMatchesSearch(people[0], "  cherry "), true);
  assert.equal(personMatchesSearch(people[2], "zed"), true);
  assert.equal(personMatchesSearch(people[1], "zed"), false);
  assert.deepEqual(
    filterPeopleBySearch(people, " AMY ").map((person) => person.id),
    [2, 3],
  );
  assert.deepEqual(
    filterPeopleBySearch(people, "   ").map((person) => person.id),
    [1, 2, 3],
  );
});

test("sorts every List option, omits null death days and keeps missing spouses last", () => {
  const idsFor = (sortOption: Parameters<typeof sortPeople>[1]) =>
    sortPeople(people, sortOption, "2026-12-30").map((person) => person.id);

  assert.deepEqual(idsFor("Birthday"), [1, 3, 2]);
  assert.deepEqual(idsFor("Age"), [1, 2, 3]);
  assert.deepEqual(idsFor("Upcoming Birthday"), [1, 2, 3]);
  assert.deepEqual(idsFor("Death Day"), [3, 1]);
  assert.deepEqual(idsFor("First Name"), [3, 2, 1]);
  assert.deepEqual(idsFor("Last Name"), [3, 1, 2]);
  assert.deepEqual(idsFor("Spouse"), [1, 3, 2]);
  assert.deepEqual(idsFor("Children"), [1, 3, 2]);
});

test("Age sorts numerically with unknown ages below zero and Birthday ascending for ties", () => {
  const rows = [
    { ...people[1], id: 4, firstName: "Aaron", birthday: "2000-09-01" },
    { ...people[1], id: 5, firstName: "Zelda", birthday: "2000-01-01" },
    { ...people[1], id: 6, birthday: null },
    { ...people[1], id: 7, birthday: "2026-09-08" },
    { ...people[1], id: 8, birthday: "2017-09-08" },
    { ...people[1], id: 9, birthday: "2016-09-08" },
    { ...people[1], id: 10, birthday: "invalid" },
    { ...people[1], id: 11, birthday: "2000-09-09" },
    { ...people[1], id: 12, birthday: "2000-09-08" },
  ];

  assert.deepEqual(
    sortPeople(rows, "Age", "2026-09-08").map((row) => row.id),
    [5, 4, 12, 11, 9, 8, 7, 6, 10],
  );
});

test("Age uses today's full date for living people and stays fixed at death for deceased people", () => {
  const rows = [
    { ...people[1], id: 4, birthday: "2000-09-09" },
    { ...people[1], id: 5, birthday: "1950-09-09", deathday: "1976-09-09" },
    { ...people[1], id: 6, birthday: "1900-09-09", deathday: "1926-09-08" },
  ];

  const idsOn = (today: string) =>
    sortPeople(rows, "Age", today).map((row) => row.id);
  assert.deepEqual(idsOn("2026-09-08"), [5, 6, 4]);
  assert.deepEqual(idsOn("2026-09-09"), [5, 4, 6]);
  assert.deepEqual(idsOn("2027-09-09"), [4, 5, 6]);
});

test("null, empty and whitespace-only Spouse values stay below populated names", () => {
  const rows = [
    { ...people[0], id: 4, spouse: "" },
    { ...people[0], id: 5, spouse: "   " },
    ...people,
  ];
  const sorted = sortPeople(rows, "Spouse", "2026-12-30");
  assert.deepEqual(
    sorted.slice(0, 2).map((row) => row.id),
    [1, 3],
  );
  assert.deepEqual(
    new Set(sorted.slice(2).map((row) => row.id)),
    new Set([2, 4, 5]),
  );
});
