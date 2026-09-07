import { connection } from "next/server";
import { getAdminList } from "@/server/admin-list";
import { AdminPeopleList } from "./AdminPeopleList";

export default async function AdminPeoplePage() {
  await connection();
  const rows = await getAdminList();
  return <AdminPeopleList rows={rows} />;
}
