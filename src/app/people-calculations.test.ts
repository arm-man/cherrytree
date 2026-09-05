import assert from "node:assert/strict";
import test from "node:test";

import { getChildCounts } from "./people-calculations.ts";

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
