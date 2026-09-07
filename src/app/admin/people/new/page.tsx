import { parseAdminRowFilter } from "@/app/admin/people/admin-display";
import { connection } from "next/server";
import { getAdminPeople } from "@/server/admin-people";
import { PersonForm } from "../PersonForm";

export default async function NewPersonPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string | string[];
    type?: string | string[];
  }>;
}) {
  await connection();
  const { search, type } = await searchParams;
  const people = await getAdminPeople();
  return (
    <>
      <h1>Add Cherry Kin</h1>
      <PersonForm
        people={people}
        search={typeof search === "string" ? search : ""}
        type={parseAdminRowFilter(type)}
      />
    </>
  );
}
