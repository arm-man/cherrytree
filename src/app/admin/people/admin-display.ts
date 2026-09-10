export function formatAdminDate(value: string | null): string {
  if (!value) return "";
  const [year, month, day] = value.split("-").map(Number);
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return `${months[month - 1]} ${day}, ${year}`;
}

export type AdminRowFilter = "all" | "cherryKin" | "spouse" | "ancestor";

export function parseAdminRowFilter(value: unknown): AdminRowFilter {
  return value === "cherryKin" || value === "spouse" || value === "ancestor"
    ? value
    : "all";
}

export interface AdminListRow {
  id: number;
  type: "cherryKin" | "spouse" | "ancestor";
  fullName: string;
  birthday: string;
  deathday: string;
  parentName: string;
  phoneNumber: string;
  spouseName: string;
}

export function filterAdminRows(
  rows: readonly AdminListRow[],
  search: string,
  type: AdminRowFilter,
): AdminListRow[] {
  const query = search.trim().toLocaleLowerCase();
  return rows.filter(
    (row) =>
      (type === "all" || row.type === type) &&
      [
        row.fullName,
        row.birthday,
        row.deathday,
        row.parentName,
        row.phoneNumber,
        row.spouseName,
      ].some((value) => value.toLocaleLowerCase().includes(query)),
  );
}

export function adminPeopleUrl(
  path: string,
  search: string,
  type: AdminRowFilter = "all",
): string {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  if (type !== "all") query.set("type", type);
  return `${path}${query.size ? `?${query}` : ""}`;
}
