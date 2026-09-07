import { connection } from "next/server";

import { PersonList } from "@/app/PersonList";
import { logServerError } from "@/server/db";
import { getPartners, getPeople } from "@/server/people";

export default async function Home() {
  await connection();

  let people;
  let partners;

  try {
    [people, partners] = await Promise.all([getPeople(), getPartners()]);
  } catch (error: unknown) {
    await logServerError("Failed to load valid People data.");
    throw error;
  }

  return (
    <main className="page-shell">
      <PersonList people={people} partners={partners} />
    </main>
  );
}
