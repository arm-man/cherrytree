import { connection } from "next/server";

import { getCurrentDatabaseTime } from "@/server/db";

export default async function Home() {
  await connection();

  const currentDatabaseTime = await getCurrentDatabaseTime();

  return currentDatabaseTime.toISOString();
}
