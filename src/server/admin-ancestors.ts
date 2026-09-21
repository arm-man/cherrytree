import "server-only";

import {
  hasAncestorChanges,
  AncestorValidationError,
  validateAncestor,
} from "@/app/admin/ancestors/ancestor-validation";
import type { AdminAncestor } from "@/app/admin/ancestors/ancestor-validation";
import { getFullName } from "@/app/admin/people/person-validation";
import { logPeopleError } from "./admin-people";
import {
  getValidationDate,
  withPeopleTransaction,
} from "./admin-people-db";
import { readAdminAncestors, writeAncestor } from "./admin-ancestors-db";

export async function getAdminAncestors(): Promise<AdminAncestor[]> {
  try {
    return await readAdminAncestors();
  } catch (error: unknown) {
    await logPeopleError("Failed to load administrative Ancestor data.", error);
    throw new Error("Something went wrong. Please try again.");
  }
}

export async function saveAncestor(
  input: unknown,
  ancestorId?: number,
): Promise<number> {
  // Reuse the admin transaction so the save and its informational log commit
  // together, and concurrent application edits cannot race the no-change check.
  return withPeopleTransaction(async (client, writeInfoLog) => {
    const stored =
      ancestorId === undefined
        ? undefined
        : (await readAdminAncestors(client)).find(
            (ancestor) => ancestor.id === ancestorId,
          );
    if (ancestorId !== undefined && !stored) {
      throw new AncestorValidationError(
        "ANCESTOR_NOT_FOUND",
        "Ancestor not found.",
      );
    }
    const values = validateAncestor(input, await getValidationDate(client));
    if (stored && !hasAncestorChanges(values, stored)) {
      throw new AncestorValidationError("NO_CHANGES", "No changes were made.");
    }
    const savedId = await writeAncestor(client, values, ancestorId);
    await writeInfoLog(
      stored
        ? `Edited Ancestor id=${savedId}, full_name=${JSON.stringify(getFullName(values))}.`
        : `Added Ancestor id=${savedId}, first_name=${JSON.stringify(values.firstName)}, last_name=${JSON.stringify(values.lastName)}, birthday=${JSON.stringify(values.birthday)}, deathday=${JSON.stringify(values.deathday)}, spouse=${JSON.stringify(values.spouse)}.`,
    );
    return savedId;
  });
}
