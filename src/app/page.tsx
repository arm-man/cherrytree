import { connection } from "next/server";

import { PersonList } from "@/app/PersonList";
import { logServerError } from "@/server/db";
import { getPeople } from "@/server/people";

export default async function Home() {
  await connection();

  let people;

  try {
    people = await getPeople();
  } catch (error: unknown) {
    await logServerError("Failed to load valid People data.");
    throw error;
  }

  return (
    <main className="page-shell">
      <PersonList people={people} />
    </main>
  );
}
