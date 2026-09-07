import { parseAdminRowFilter } from "@/app/admin/people/admin-display";
import { connection } from "next/server";
import { getAdminPeople } from "@/server/admin-people";
import { PartnerForm } from "../PartnerForm";

export default async function NewPartnerPage({
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
      <h1>Add Spouse</h1>
      <PartnerForm
        people={people}
        search={typeof search === "string" ? search : ""}
        type={parseAdminRowFilter(type)}
      />
    </>
  );
}
