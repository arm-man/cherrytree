import { parseAdminRowFilter } from "@/app/admin/people/admin-display";
import { connection } from "next/server";
import { AncestorForm } from "../AncestorForm";

export default async function NewAncestorPage({
  searchParams,
}: {
  searchParams: Promise<{
    search?: string | string[];
    type?: string | string[];
  }>;
}) {
  await connection();
  const { search, type } = await searchParams;
  return (
    <>
      <h1>Add Ancestor</h1>
      <AncestorForm
        search={typeof search === "string" ? search : ""}
        type={parseAdminRowFilter(type)}
      />
    </>
  );
}
