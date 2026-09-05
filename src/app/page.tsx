import Image from "next/image";
import { connection } from "next/server";

import birthcake from "../../public/birthcake.jpg";
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
      <h1 className="wordmark">
        <Image
          className="wordmark-icon"
          src={birthcake}
          alt=""
          priority
          unoptimized
        />
        <span className="wordmark-label">
          <span>Cherry</span> Tree
        </span>
      </h1>
      <PersonList people={people} />
    </main>
  );
}
