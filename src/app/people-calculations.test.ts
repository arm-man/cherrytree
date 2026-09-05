import assert from "node:assert/strict";
import test from "node:test";

import {
  getChildCounts,
  getGenealogyGenerations,
} from "./people-calculations.ts";

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
  const people = [
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

  const generations = getGenealogyGenerations(people, 1);

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
