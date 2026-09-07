import "server-only";

import { PartnerValidationError } from "@/app/admin/partners/partner-validation";
import { savePartner } from "./admin-partners";
import { logPeopleError } from "./admin-people";

export async function handlePartnerSave(
  request: Request,
  partnerId?: number,
): Promise<Response> {
  try {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      throw new PartnerValidationError(
        "REQUIRED_FIELD_MISSING",
        "Send a valid JSON object with the Spouse's details.",
      );
    }
    const savedId = await savePartner(input, partnerId);
    return Response.json(
      { partnerId: savedId },
      { status: partnerId === undefined ? 201 : 200 },
    );
  } catch (error: unknown) {
    if (error instanceof PartnerValidationError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        {
          status: error.code === "PARTNER_NOT_FOUND" ? 404 : 400,
        },
      );
    }
    await logPeopleError(
      `Failed to ${partnerId === undefined ? "create" : "edit"} a Partner.`,
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
