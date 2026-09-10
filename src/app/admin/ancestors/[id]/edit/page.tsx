import { parseAdminRowFilter } from "@/app/admin/people/admin-display";
import { connection } from "next/server";
import { notFound } from "next/navigation";
import { getAdminAncestors } from "@/server/admin-ancestors";
import { AncestorForm } from "../../AncestorForm";

export default async function EditAncestorPage({
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
  const ancestor = (await getAdminAncestors()).find(
    (ancestor) => ancestor.id === Number(id),
  );
  if (!ancestor) notFound();
  const { search, type } = await searchParams;
  return (
    <>
      <h1>Edit Ancestor</h1>
      <AncestorForm
        ancestor={ancestor}
        search={typeof search === "string" ? search : ""}
        type={parseAdminRowFilter(type)}
      />
    </>
  );
}
