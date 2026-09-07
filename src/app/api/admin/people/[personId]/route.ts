import { handlePersonSave } from "@/server/admin-people-http";

export const runtime = "nodejs";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ personId: string }> },
): Promise<Response> {
  const { personId } = await params;
  if (!/^[1-9]\d*$/.test(personId) || Number(personId) > 2147483647) {
    return Response.json(
      { error: { code: "PERSON_NOT_FOUND", message: "Cherry Kin not found." } },
      { status: 404 },
    );
  }
  return handlePersonSave(request, Number(personId));
}
