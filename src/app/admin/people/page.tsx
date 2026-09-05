import { connection } from "next/server";
import { getAdminPeople } from "@/server/admin-people";
import { AdminPeopleList } from "./AdminPeopleList";

export default async function AdminPeoplePage() {
  await connection();
  const people = await getAdminPeople();
  return <AdminPeopleList people={people} />;
}
