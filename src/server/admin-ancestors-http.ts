import "server-only";

import { AncestorValidationError } from "@/app/admin/ancestors/ancestor-validation";
import { saveAncestor } from "./admin-ancestors";
import { logPeopleError } from "./admin-people";

export async function handleAncestorSave(
  request: Request,
  ancestorId?: number,
): Promise<Response> {
  try {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      throw new AncestorValidationError(
        "REQUIRED_FIELD_MISSING",
        "Send a valid JSON object with the Ancestor's details.",
      );
    }
    const savedId = await saveAncestor(input, ancestorId);
    return Response.json(
      { ancestorId: savedId },
      { status: ancestorId === undefined ? 201 : 200 },
    );
  } catch (error: unknown) {
    if (error instanceof AncestorValidationError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        {
          status: error.code === "ANCESTOR_NOT_FOUND" ? 404 : 400,
        },
      );
    }
    await logPeopleError(
      `Failed to ${ancestorId === undefined ? "create" : "edit"} an Ancestor.`,
      error,
    );
    return Response.json(
      {
        error: {
          code: "INTERNAL_ERROR",
          message: "Something went wrong. Please try again.",
        },
      },
      { status: 500 },
    );
  }
}
