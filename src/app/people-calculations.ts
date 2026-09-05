import { getDaysUntilNextBirthday } from "./date-calculations.ts";

interface PersonRelationship {
  id: number;
  parentId: number | null;
}

interface GenealogyPerson extends PersonRelationship {
  birthday: string;
}

interface ListPerson extends GenealogyPerson {
  firstName: string;
  lastName: string;
  deathday: string | null;
  spouse: string | null;
}

interface SearchablePerson {
  firstName: string;
  lastName: string;
  spouse: string | null;
}

export const SORT_OPTIONS = [
  "Birthday",
  "Upcoming Birthday",
  "Death Day",
  "First Name",
  "Last Name",
  "Spouse",
  "Children",
] as const;

export type SortOption = (typeof SORT_OPTIONS)[number];

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

function compareText(firstValue: string, secondValue: string): number {
  return firstValue.localeCompare(secondValue, undefined, {
    sensitivity: "base",
  });
}

function getFullName(person: SearchablePerson): string {
  return `${person.firstName} ${person.lastName}`;
}

function compareFullNames(
  firstPerson: SearchablePerson,
  secondPerson: SearchablePerson,
): number {
  return compareText(getFullName(firstPerson), getFullName(secondPerson));
}

export function personMatchesSearch(
  person: SearchablePerson,
  searchText: string,
): boolean {
  const searchTerm = searchText.trim().toLocaleLowerCase();

  if (!searchTerm) {
    return false;
  }

  return (
    getFullName(person).toLocaleLowerCase().includes(searchTerm) ||
    (person.spouse?.toLocaleLowerCase().includes(searchTerm) ?? false)
  );
}

export function filterPeopleBySearch<T extends SearchablePerson>(
  people: readonly T[],
  searchText: string,
): T[] {
  if (!searchText.trim()) {
    return [...people];
  }

  return people.filter((person) => personMatchesSearch(person, searchText));
}

export function sortPeople<T extends ListPerson>(
  people: readonly T[],
  sortOption: SortOption,
  today: string,
  childCounts: ReadonlyMap<number, number>,
): T[] {
  const sortablePeople = people.filter((person) => {
    if (sortOption === "Death Day") {
      return person.deathday !== null;
    }

    if (sortOption === "Spouse") {
      return person.spouse !== null && person.spouse.trim() !== "";
    }

    return true;
  });

  return sortablePeople.sort((firstPerson, secondPerson) => {
    let primaryOrder = 0;

    switch (sortOption) {
      case "Birthday":
        primaryOrder = firstPerson.birthday.localeCompare(
          secondPerson.birthday,
        );
        break;
      case "Upcoming Birthday":
        primaryOrder =
          getDaysUntilNextBirthday(firstPerson.birthday, today) -
          getDaysUntilNextBirthday(secondPerson.birthday, today);
        break;
      case "Death Day":
        primaryOrder = (firstPerson.deathday ?? "").localeCompare(
          secondPerson.deathday ?? "",
        );
        break;
      case "First Name":
        primaryOrder = compareText(
          firstPerson.firstName,
          secondPerson.firstName,
        );
        return (
          primaryOrder ||
          compareText(firstPerson.lastName, secondPerson.lastName)
        );
      case "Last Name":
        primaryOrder = compareText(
          firstPerson.lastName,
          secondPerson.lastName,
        );
        return (
          primaryOrder ||
          compareText(firstPerson.firstName, secondPerson.firstName)
        );
      case "Spouse":
        primaryOrder = compareText(
          firstPerson.spouse ?? "",
          secondPerson.spouse ?? "",
        );
        break;
      case "Children":
        primaryOrder =
          (childCounts.get(secondPerson.id) ?? 0) -
          (childCounts.get(firstPerson.id) ?? 0);
        break;
    }

    return primaryOrder || compareFullNames(firstPerson, secondPerson);
  });
}
