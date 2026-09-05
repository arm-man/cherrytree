import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getAdminPeople } from "@/server/admin-people";
import { PersonForm } from "../../PersonForm";

export default async function EditPersonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ search?: string | string[] }>;
}) {
  await connection();
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) notFound();
  const people = await getAdminPeople();
  const person = people.find((person) => person.id === Number(id));
  if (!person) notFound();
  const { search } = await searchParams;
  return (
    <>
      <h1>Edit Person</h1>
      <PersonForm
        people={people}
        person={person}
        search={typeof search === "string" ? search : ""}
      />
    </>
  );
}
