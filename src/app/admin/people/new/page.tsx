import { connection } from "next/server";
import { getAdminPeople } from "@/server/admin-people";
import { PersonForm } from "../PersonForm";

export default async function NewPersonPage({
  searchParams,
}: {
  searchParams: Promise<{ search?: string | string[] }>;
}) {
  await connection();
  const { search } = await searchParams;
  const people = await getAdminPeople();
  return (
    <>
      <h1>Add Person</h1>
      <PersonForm
        people={people}
        search={typeof search === "string" ? search : ""}
      />
    </>
  );
}
