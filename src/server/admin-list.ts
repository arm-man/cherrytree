import "server-only";

import { formatAdminDate } from "@/app/admin/people/admin-display";
import type { AdminListRow } from "@/app/admin/people/admin-display";
import { formatPhoneNumber } from "@/app/admin/people/phone-number";
import { getFullName } from "@/app/admin/people/person-validation";
import { getAdminPeople } from "./admin-people";
import { getAdminPartners } from "./admin-partners";
import { getAdminAncestors } from "./admin-ancestors";

export async function getAdminList(): Promise<AdminListRow[]> {
  // Three bulk reads and a name map resolve both relationships without N+1 queries.
  const [people, partners, ancestors] = await Promise.all([
    getAdminPeople(),
    getAdminPartners(),
    getAdminAncestors(),
  ]);
  const names = new Map(
    people.map((person) => [person.id, getFullName(person)]),
  );
  const rows: AdminListRow[] = people.map((person) => ({
    id: person.id,
    type: "cherryKin",
    fullName: getFullName(person),
    birthday: formatAdminDate(person.birthday),
    deathday: formatAdminDate(person.deathday),
    parentName: names.get(person.parentId ?? 0) ?? "",
    phoneNumber: formatPhoneNumber(person.phoneNumber),
    spouseName: "",
  }));
  for (const partner of partners) {
    rows.push({
      id: partner.id,
      type: "spouse",
      fullName: getFullName(partner),
      birthday: formatAdminDate(partner.birthday),
      deathday: formatAdminDate(partner.deathday),
      parentName: "",
      phoneNumber: "",
      spouseName: names.get(partner.partnerId) ?? "",
    });
  }
  for (const ancestor of ancestors) {
    rows.push({
      id: ancestor.id,
      type: "ancestor",
      fullName: getFullName(ancestor),
      birthday: formatAdminDate(ancestor.birthday),
      deathday: formatAdminDate(ancestor.deathday),
      parentName: "",
      phoneNumber: "",
      spouseName: ancestor.spouse ?? "",
    });
  }
  return rows.sort((a, b) =>
    a.fullName.localeCompare(b.fullName, "en", { sensitivity: "base" }),
  );
}
