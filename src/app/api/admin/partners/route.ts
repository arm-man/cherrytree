import { handlePartnerSave } from "@/server/admin-partners-http";

export const runtime = "nodejs";

export async function POST(request: Request): Promise<Response> {
  return handlePartnerSave(request);
}
