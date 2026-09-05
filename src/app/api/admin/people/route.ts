import { handlePersonSave } from "@/server/admin-people-http";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handlePersonSave(request);
}
