import { handleAncestorSave } from "@/server/admin-ancestors-http";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ ancestorId: string }> },
): Promise<Response> {
  const { ancestorId } = await params;
  if (!/^[1-9]\d*$/.test(ancestorId) || Number(ancestorId) > 2147483647) {
    return Response.json(
      { error: { code: "ANCESTOR_NOT_FOUND", message: "Ancestor not found." } },
      { status: 404 },
    );
  }
  return handleAncestorSave(request, Number(ancestorId));
}
