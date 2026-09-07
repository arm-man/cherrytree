import { parseAdminRowFilter } from "@/app/admin/people/admin-display";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getAdminPartners } from "@/server/admin-partners";
import { getAdminPeople } from "@/server/admin-people";
import { PartnerForm } from "../../PartnerForm";

export default async function EditPartnerPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    search?: string | string[];
    type?: string | string[];
  }>;
}) {
  await connection();
  const { id } = await params;
  if (!/^[1-9]\d*$/.test(id) || Number(id) > 2147483647) notFound();
  const people = await getAdminPeople();
  const partner = (await getAdminPartners()).find(
    (partner) => partner.id === Number(id),
  );
  if (!partner) notFound();
  const { search, type } = await searchParams;
  return (
    <>
      <h1>Edit Spouse</h1>
      <PartnerForm
        people={people}
        partner={partner}
        search={typeof search === "string" ? search : ""}
        type={parseAdminRowFilter(type)}
      />
    </>
  );
}
