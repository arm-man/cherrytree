import "server-only";

import {
  hasPartnerChanges,
  PartnerValidationError,
  validatePartner,
} from "@/app/admin/partners/partner-validation";
import type { AdminPartner } from "@/app/admin/partners/partner-validation";
import { getFullName } from "@/app/admin/people/person-validation";
import { logPeopleError } from "./admin-people";
import {
  getValidationDate,
  readAdminPeople,
  withPeopleTransaction,
} from "./admin-people-db";
import { readAdminPartners, writePartner } from "./admin-partners-db";

export async function getAdminPartners(): Promise<AdminPartner[]> {
  try {
    return await readAdminPartners();
  } catch (error: unknown) {
    await logPeopleError("Failed to load administrative Spouse data.", error);
    throw new Error("Something went wrong. Please try again.");
  }
}

export async function savePartner(
  input: unknown,
  partnerId?: number,
): Promise<number> {
  // Use the same writer lock as Cherry Kin saves so association validation and
  // no-change checks remain consistent across concurrent admin requests.
  return withPeopleTransaction(async (client, writeInfoLog) => {
    const people = await readAdminPeople(client);
    const stored =
      partnerId === undefined
        ? undefined
        : (await readAdminPartners(client)).find(
            (partner) => partner.id === partnerId,
          );
    if (partnerId !== undefined && !stored) {
      throw new PartnerValidationError(
        "PARTNER_NOT_FOUND",
        "Spouse not found.",
      );
    }
    const values = validatePartner(
      input,
      people,
      await getValidationDate(client),
    );
    if (stored && !hasPartnerChanges(values, stored)) {
      throw new PartnerValidationError("NO_CHANGES", "No changes were made.");
    }
    const savedId = await writePartner(client, values, partnerId);
    const associatedPerson = people.find(
      (person) => person.id === values.partnerId,
    );
    if (!associatedPerson) {
      // Server validation already requires this association. Keep the guard so
      // the log can never silently substitute an id or an incorrect name.
      throw new Error("Spouse association references missing Cherry Kin.");
    }
    const addedDetails = [
      `full_name=${JSON.stringify(getFullName(values))}`,
      ...(values.birthday
        ? [`birthday=${JSON.stringify(values.birthday)}`]
        : []),
      ...(values.deathday
        ? [`deathday=${JSON.stringify(values.deathday)}`]
        : []),
      `partner_full_name=${JSON.stringify(getFullName(associatedPerson))}`,
    ];
    await writeInfoLog(
      stored
        ? `Edited Spouse id=${savedId}, full_name=${JSON.stringify(getFullName(values))}, partner_id=${values.partnerId}.`
        : `Added Spouse id=${savedId}, ${addedDetails.join(", ")}.`,
    );
    return savedId;
  });
}
