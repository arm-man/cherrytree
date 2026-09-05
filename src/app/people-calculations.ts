interface PersonRelationship {
  id: number;
  parentId: number | null;
}

interface GenealogyPerson extends PersonRelationship {
  birthday: string;
}

export interface GenealogyGenerations<T extends GenealogyPerson> {
  children: T[];
  grandchildren: T[];
  greatGrandchildren: T[];
  greatGreatGrandchildren: T[];
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

export function getGenealogyGenerations<T extends GenealogyPerson>(
  people: readonly T[],
  rootPersonId: number,
): GenealogyGenerations<T> {
  const peopleById = new Map(people.map((person) => [person.id, person]));

  function getChildren(parentIds: ReadonlySet<number>): T[] {
    return people
      .filter(
        (person) =>
          person.parentId !== null && parentIds.has(person.parentId),
      )
      .sort((firstPerson, secondPerson) => {
        if (firstPerson.parentId !== secondPerson.parentId) {
          const firstParentBirthday =
            peopleById.get(firstPerson.parentId ?? 0)?.birthday ?? "";
          const secondParentBirthday =
            peopleById.get(secondPerson.parentId ?? 0)?.birthday ?? "";
          const parentBirthdayOrder = firstParentBirthday.localeCompare(
            secondParentBirthday,
          );

          if (parentBirthdayOrder !== 0) {
            return parentBirthdayOrder;
          }
        }

        return firstPerson.birthday.localeCompare(secondPerson.birthday);
      });
  }

  const children = getChildren(new Set([rootPersonId]));
  const grandchildren = getChildren(
    new Set(children.map((person) => person.id)),
  );
  const greatGrandchildren = getChildren(
    new Set(grandchildren.map((person) => person.id)),
  );
  const greatGreatGrandchildren = getChildren(
    new Set(greatGrandchildren.map((person) => person.id)),
  );

  return {
    children,
    grandchildren,
    greatGrandchildren,
    greatGreatGrandchildren,
  };
}
