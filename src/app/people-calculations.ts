import { calculateAge, getDaysUntilNextBirthday } from "./date-calculations.ts";

interface PersonRelationship {
  id: number;
  parentId: number | null;
  isStepOrAdopted: boolean;
}

interface GenealogyPerson extends PersonRelationship {
  birthday: string;
}

interface ListPerson {
  birthday: string | null;
  firstName: string;
  lastName: string;
  deathday: string | null;
  spouse: string | null;
  childCount: number | null;
}

interface SearchablePerson {
  firstName: string;
  lastName: string;
  spouse: string | null;
}

export const SORT_OPTIONS = [
  "Birthday",
  "Age",
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
  counts: {
    children: DescendantCounts;
    grandchildren: DescendantCounts;
    greatGrandchildren: DescendantCounts;
    greatGreatGrandchildren: DescendantCounts;
  };
}

export interface DescendantCounts {
  normal: number;
  stepOrAdopted: number;
}

export function getChildCounts(
  people: readonly PersonRelationship[],
): Map<number, DescendantCounts> {
  const childCounts = new Map<number, DescendantCounts>();

  for (const person of people) {
    childCounts.set(person.id, { normal: 0, stepOrAdopted: 0 });
  }

  for (const person of people) {
    if (person.parentId !== null) {
      const counts = childCounts.get(person.parentId) ?? {
        normal: 0,
        stepOrAdopted: 0,
      };
      childCounts.set(person.parentId, {
        normal: counts.normal + Number(!person.isStepOrAdopted),
        stepOrAdopted:
          counts.stepOrAdopted + Number(person.isStepOrAdopted),
      });
    }
  }

  return childCounts;
}

export function getGenealogyGenerations<T extends GenealogyPerson>(
  people: readonly T[],
  rootPersonId: number,
): GenealogyGenerations<T> {
  const peopleById = new Map(people.map((person) => [person.id, person]));

  function getChildren(
    parentBranches: ReadonlyMap<number, boolean>,
  ): { people: T[]; branches: Map<number, boolean>; counts: DescendantCounts } {
    const descendants = people
      .filter(
        (person) =>
          person.parentId !== null && parentBranches.has(person.parentId),
      )
      .sort((firstPerson, secondPerson) => {
        if (firstPerson.parentId !== secondPerson.parentId) {
          const firstParentBirthday =
            peopleById.get(firstPerson.parentId ?? 0)?.birthday ?? "";
          const secondParentBirthday =
            peopleById.get(secondPerson.parentId ?? 0)?.birthday ?? "";
          const parentBirthdayOrder =
            firstParentBirthday.localeCompare(secondParentBirthday);

          if (parentBirthdayOrder !== 0) {
            return parentBirthdayOrder;
          }
        }

        return firstPerson.birthday.localeCompare(secondPerson.birthday);
      });

    const branches = new Map<number, boolean>();
    let stepOrAdopted = 0;
    for (const person of descendants) {
      // Once a path crosses a step/adopted child, every later descendant on
      // that path remains in the step/adopted branch relative to this Root.
      const isStepOrAdoptedBranch =
        person.isStepOrAdopted ||
        (person.parentId !== null &&
          (parentBranches.get(person.parentId) ?? false));
      branches.set(person.id, isStepOrAdoptedBranch);
      stepOrAdopted += Number(isStepOrAdoptedBranch);
    }

    return {
      people: descendants,
      branches,
      counts: {
        normal: descendants.length - stepOrAdopted,
        stepOrAdopted,
      },
    };
  }

  const children = getChildren(new Map([[rootPersonId, false]]));
  const grandchildren = getChildren(children.branches);
  const greatGrandchildren = getChildren(grandchildren.branches);
  const greatGreatGrandchildren = getChildren(greatGrandchildren.branches);

  return {
    children: children.people,
    grandchildren: grandchildren.people,
    greatGrandchildren: greatGrandchildren.people,
    greatGreatGrandchildren: greatGreatGrandchildren.people,
    counts: {
      children: children.counts,
      grandchildren: grandchildren.counts,
      greatGrandchildren: greatGrandchildren.counts,
      greatGreatGrandchildren: greatGreatGrandchildren.counts,
    },
  };
}

export function formatChildCountDescription(
  normalCount: number,
  stepOrAdoptedCount: number,
): string {
  const normalLabel = normalCount === 1 ? "child" : "children";
  const stepOrAdoptedLabel =
    stepOrAdoptedCount === 1 ? "child" : "children";
  return `${normalCount} ${normalLabel} + ${stepOrAdoptedCount} step/adopted ${stepOrAdoptedLabel}`;
}

function compareText(
  firstValue: string | null,
  secondValue: string | null,
): number {
  const firstIsBlank = firstValue === null || firstValue.trim() === "";
  const secondIsBlank = secondValue === null || secondValue.trim() === "";
  if (firstIsBlank || secondIsBlank) {
    return Number(firstIsBlank) - Number(secondIsBlank);
  }

  return firstValue.localeCompare(secondValue, undefined, {
    sensitivity: "base",
  });
}

export function getFullName(person: {
  firstName: string;
  lastName: string;
}): string {
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
): T[] {
  // Death Day is the only sort that omits rows with missing data.
  const sortablePeople =
    sortOption === "Death Day"
      ? people.filter((person) => person.deathday !== null)
      : [...people];

  return sortablePeople.sort((firstPerson, secondPerson) => {
    let primaryOrder = 0;

    switch (sortOption) {
      case "Age": {
        // Use the same completed-years calculation as the Age column.
        const firstAge = firstPerson.birthday
          ? calculateAge(firstPerson.birthday, firstPerson.deathday ?? today)
          : NaN;
        const secondAge = secondPerson.birthday
          ? calculateAge(secondPerson.birthday, secondPerson.deathday ?? today)
          : NaN;
        const firstHasAge = Number.isFinite(firstAge);
        const secondHasAge = Number.isFinite(secondAge);

        if (!firstHasAge || !secondHasAge) {
          return Number(secondHasAge) - Number(firstHasAge);
        }

        return (
          secondAge - firstAge ||
          compareText(firstPerson.birthday, secondPerson.birthday)
        );
      }
      case "Birthday":
      case "Upcoming Birthday":
        // Missing dates stay below real dates; never parse null as a date.
        if (firstPerson.birthday === null || secondPerson.birthday === null) {
          return (
            Number(firstPerson.birthday === null) -
              Number(secondPerson.birthday === null) ||
            compareFullNames(firstPerson, secondPerson)
          );
        }
        primaryOrder =
          sortOption === "Birthday"
            ? firstPerson.birthday.localeCompare(secondPerson.birthday)
            : getDaysUntilNextBirthday(firstPerson.birthday, today) -
              getDaysUntilNextBirthday(secondPerson.birthday, today);
        break;
      case "Death Day":
        primaryOrder = compareText(firstPerson.deathday, secondPerson.deathday);
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
        primaryOrder = compareText(firstPerson.lastName, secondPerson.lastName);
        return (
          primaryOrder ||
          compareText(firstPerson.firstName, secondPerson.firstName)
        );
      case "Spouse":
        primaryOrder = compareText(firstPerson.spouse, secondPerson.spouse);
        break;
      case "Children":
        primaryOrder =
          // Child counts are nonnegative; -1 explicitly puts missing counts last.
          (secondPerson.childCount ?? -1) - (firstPerson.childCount ?? -1);
        break;
    }

    return primaryOrder || compareFullNames(firstPerson, secondPerson);
  });
}
