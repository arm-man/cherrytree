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

export function adminPeopleUrl(path: string, search: string): string {
  const query = new URLSearchParams();
  if (search) query.set("search", search);
  return `${path}${query.size ? `?${query}` : ""}`;
}
