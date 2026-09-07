import { handlePartnerSave } from "@/server/admin-partners-http";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ partnerId: string }> },
): Promise<Response> {
  const { partnerId } = await params;
  if (!/^[1-9]\d*$/.test(partnerId) || Number(partnerId) > 2147483647) {
    return Response.json(
      { error: { code: "PARTNER_NOT_FOUND", message: "Spouse not found." } },
      { status: 404 },
    );
  }
  return handlePartnerSave(request, Number(partnerId));
}
