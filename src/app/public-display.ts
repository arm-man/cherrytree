import { getChildCounts, getFullName } from "./people-calculations.ts";

export interface PublicPerson {
  id: number;
  parentId: number | null;
  firstName: string;
  lastName: string;
  birthday: string;
  deathday: string | null;
  phoneNumber: string | null;
}

export interface PublicPartner {
  id: number;
  partnerId: number;
  firstName: string;
  lastName: string;
  birthday: string | null;
  deathday: string | null;
}

export interface CherryKinRow extends PublicPerson {
  type: "cherryKin";
  rowKey: string;
  navigationPersonId: number;
  spouse: string | null;
  childCount: number;
}

export interface PartnerRow extends PublicPartner {
  type: "partner";
  rowKey: string;
  navigationPersonId: number;
  spouse: string;
  childCount: number | null;
}

export type PublicRow = CherryKinRow | PartnerRow;

export function getPublicRows(
  people: readonly PublicPerson[],
  partners: readonly PublicPartner[],
): { people: CherryKinRow[]; partners: PartnerRow[] } {
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const childCounts = getChildCounts(people);
  const spouseNames = new Map<number, string[]>();
  const partnerRows: PartnerRow[] = [];

  // Resolve associations by ID in memory after two bulk reads. Names are never
  // identities: even identical names represent separate records.
  for (const partner of partners) {
    const person = peopleById.get(partner.partnerId);
    if (!person) {
      continue;
    }

    const names = spouseNames.get(person.id) ?? [];
    names.push(getFullName(partner));
    spouseNames.set(person.id, names);
    partnerRows.push({
      ...partner,
      type: "partner",
      rowKey: `partner-${partner.id}`,
      navigationPersonId: partner.partnerId,
      spouse: getFullName(person),
      childCount: null,
    });
  }

  // Count all associated partners before assigning children, including partners
  // without birthdays. Search must not turn a multiple-spouse relationship into one.
  for (const partner of partnerRows) {
    if (spouseNames.get(partner.partnerId)?.length === 1) {
      partner.childCount = childCounts.get(partner.partnerId) ?? 0;
    }
  }

  return {
    people: people.map((person) => ({
      ...person,
      type: "cherryKin",
      rowKey: `person-${person.id}`,
      navigationPersonId: person.id,
      spouse: spouseNames.get(person.id)?.join(", ") ?? null,
      childCount: childCounts.get(person.id) ?? 0,
    })),
    partners: partnerRows,
  };
}

export function getListRows(
  people: readonly CherryKinRow[],
  partners: readonly PartnerRow[],
): PublicRow[] {
  return [...people, ...partners];
}

export function getParentSection(
  rootPerson: CherryKinRow | undefined,
  partners: readonly PartnerRow[],
): { title: string; rows: PublicRow[] } {
  const spouses = rootPerson
    ? partners.filter((partner) => partner.partnerId === rootPerson.id)
    : [];

  return {
    title:
      spouses.length === 0
        ? "Parent"
        : spouses.length === 1
          ? "Parents"
          : "Parent & Spouses",
    rows: rootPerson ? [rootPerson, ...spouses] : [],
  };
}
