import { handleAncestorSave } from "@/server/admin-ancestors-http";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handleAncestorSave(request);
}
