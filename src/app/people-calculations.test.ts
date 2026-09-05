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
  },
  {
    id: 2,
    parentId: 1,
    firstName: "Amy",
    lastName: "Young",
    birthday: "1970-01-02",
    deathday: null,
    spouse: null,
  },
  {
    id: 3,
    parentId: 1,
    firstName: "Amy",
    lastName: "Able",
    birthday: "1965-06-15",
    deathday: "2010-03-01",
    spouse: "Zed Able",
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

test("sorts every List option and omits missing death days and spouses", () => {
  const childCounts = getChildCounts(people);
  const idsFor = (sortOption: Parameters<typeof sortPeople>[1]) =>
    sortPeople(people, sortOption, "2026-12-30", childCounts).map(
      (person) => person.id,
    );

  assert.deepEqual(idsFor("Birthday"), [1, 3, 2]);
  assert.deepEqual(idsFor("Upcoming Birthday"), [1, 2, 3]);
  assert.deepEqual(idsFor("Death Day"), [3, 1]);
  assert.deepEqual(idsFor("First Name"), [3, 2, 1]);
  assert.deepEqual(idsFor("Last Name"), [3, 1, 2]);
  assert.deepEqual(idsFor("Spouse"), [1, 3]);
  assert.deepEqual(idsFor("Children"), [1, 3, 2]);
});
