import "server-only";

import { PersonValidationError } from "@/app/admin/people/person-validation";
import { logPeopleError, savePerson } from "./admin-people";

export async function handlePersonSave(
  request: Request,
  personId?: number,
): Promise<Response> {
  try {
    let input: unknown;
    try {
      input = await request.json();
    } catch {
      throw new PersonValidationError(
        "REQUIRED_FIELD_MISSING",
        "Send a valid JSON object with the Person's details.",
      );
    }
    const savedId = await savePerson(input, personId);
    return Response.json(
      { personId: savedId },
      { status: personId === undefined ? 201 : 200 },
    );
  } catch (error: unknown) {
    if (error instanceof PersonValidationError) {
      return Response.json(
        { error: { code: error.code, message: error.message } },
        {
          status: error.code === "PERSON_NOT_FOUND" ? 404 : 400,
        },
      );
    }
    await logPeopleError(
      `Failed to ${personId === undefined ? "create" : "edit"} a Person.`,
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
