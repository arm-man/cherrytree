import { connection } from "next/server";

import { PersonList } from "@/app/PersonList";
import { logServerError } from "@/server/db";
import { getPersonById } from "@/server/people";

export default async function Home() {
  await connection();

  let person;

  try {
    person = await getPersonById(1);
  } catch (error: unknown) {
    await logServerError("Failed to load the Version 1 Person.");
    throw error;
  }

  return (
    <main className="page-shell">
      <h1 className="wordmark">
        <span>Cherry</span> Tree
      </h1>
      <PersonList people={person ? [person] : []} />
    </main>
  );
}
