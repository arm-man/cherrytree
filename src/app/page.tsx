import { connection } from "next/server";

import { PersonList } from "@/app/PersonList";
import { logServerError } from "@/server/db";
import { getPartners, getPeople } from "@/server/people";
import { readAdminAncestors } from "@/server/admin-ancestors-db";

export default async function Home() {
  await connection();

  let people;
  let partners;
  let ancestors;

  try {
    [people, partners, ancestors] = await Promise.all([
      getPeople(),
      getPartners(),
      readAdminAncestors(),
    ]);
  } catch (error: unknown) {
    await logServerError("Failed to load valid People data.");
    throw error;
  }

  return (
    <main className="page-shell">
      <PersonList people={people} partners={partners} ancestors={ancestors} />
    </main>
  );
}
