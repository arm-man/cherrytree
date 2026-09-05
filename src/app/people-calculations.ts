interface PersonRelationship {
  id: number;
  parentId: number | null;
}

export function getChildCounts(
  people: readonly PersonRelationship[],
): Map<number, number> {
  const childCounts = new Map<number, number>();

  for (const person of people) {
    childCounts.set(person.id, 0);
  }

  for (const person of people) {
    if (person.parentId !== null) {
      childCounts.set(
        person.parentId,
        (childCounts.get(person.parentId) ?? 0) + 1,
      );
    }
  }

  return childCounts;
}
