import { getChildCounts, getFullName } from "./people-calculations.ts";

export interface PublicPerson {
  id: number;
  parentId: number | null;
  isStepOrAdopted: boolean;
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

export const ROOT_PERSON_ID = 1;

export function getPartnerNavigationPersonId(
  partner: Pick<PublicPartner, "id">,
): number | null {
  return partner.id === 1 ? ROOT_PERSON_ID : null;
}

export interface PublicAncestor {
  id: number;
  firstName: string;
  lastName: string;
  birthday: string;
  deathday: string | null;
  spouse: string | null;
}

export interface AncestorRow extends PublicAncestor {
  type: "ancestor";
  rowKey: string;
  navigationPersonId: null;
  childCount: null;
  stepOrAdoptedChildCount: null;
}

export interface CherryKinRow extends PublicPerson {
  type: "cherryKin";
  rowKey: string;
  navigationPersonId: number;
  spouse: string | null;
  childCount: number;
  stepOrAdoptedChildCount: number;
}

export interface PartnerRow extends PublicPartner {
  type: "partner";
  rowKey: string;
  navigationPersonId: number | null;
  spouse: string;
  childCount: number | null;
  stepOrAdoptedChildCount: number | null;
}

export type PublicRow = CherryKinRow | PartnerRow | AncestorRow;

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
      navigationPersonId: getPartnerNavigationPersonId(partner),
      spouse: getFullName(person),
      childCount: null,
      stepOrAdoptedChildCount: null,
    });
  }

  // Count all associated partners before assigning children, including partners
  // without birthdays. Search must not turn a multiple-spouse relationship into one.
  for (const partner of partnerRows) {
    if (spouseNames.get(partner.partnerId)?.length === 1) {
      const counts = childCounts.get(partner.partnerId) ?? {
        normal: 0,
        stepOrAdopted: 0,
      };
      partner.childCount = counts.normal;
      partner.stepOrAdoptedChildCount = counts.stepOrAdopted;
    }
  }

  return {
    people: people.map((person) => {
      const counts = childCounts.get(person.id) ?? {
        normal: 0,
        stepOrAdopted: 0,
      };
      return {
        ...person,
        type: "cherryKin",
        rowKey: `person-${person.id}`,
        navigationPersonId: person.id,
        spouse: spouseNames.get(person.id)?.join(", ") ?? null,
        childCount: counts.normal,
        stepOrAdoptedChildCount: counts.stepOrAdopted,
      };
    }),
    partners: partnerRows,
  };
}

export function getListRows(
  people: readonly CherryKinRow[],
  partners: readonly PartnerRow[],
  ancestors: readonly PublicAncestor[] = [],
): PublicRow[] {
  // Independent records belong only to List View, never to genealogy relationships.
  const ancestorRows: AncestorRow[] = ancestors.map((ancestor) => ({
    ...ancestor,
    type: "ancestor",
    rowKey: `ancestor-${ancestor.id}`,
    navigationPersonId: null,
    childCount: null,
    stepOrAdoptedChildCount: null,
  }));
  return [...people, ...partners, ...ancestorRows];
}

export function getParentSection(
  rootPerson: CherryKinRow | undefined,
  partners: readonly PartnerRow[],
): { rows: PublicRow[] } {
  const spouses = rootPerson
    ? partners.filter((partner) => partner.partnerId === rootPerson.id)
    : [];

  return {
    rows: rootPerson ? [rootPerson, ...spouses] : [],
  };
}

export function getAncestorSections(
  rootPerson: CherryKinRow | undefined,
  peopleById: ReadonlyMap<number, CherryKinRow>,
  partners: readonly PartnerRow[],
): { title: string; rows: PublicRow[] }[] {
  const sections: { title: string; rows: PublicRow[] }[] = [];
  let person = rootPerson;

  // Only Cherry Kin parent IDs advance this fixed-depth chain. Spouses are
  // display rows, never ancestry branches; all data is already loaded.
  for (const title of ["Parents", "Grandparents", "Great Grandparents"]) {
    if (!person || person.parentId === null) {
      break;
    }

    person = peopleById.get(person.parentId);
    if (!person) {
      break;
    }

    sections.push({ title, rows: getParentSection(person, partners).rows });
  }

  // Display the oldest ancestor generation first, ending with Parents above the Root.
  return sections.reverse();
}
