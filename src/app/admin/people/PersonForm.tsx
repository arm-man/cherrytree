"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { getLocalDateOnly } from "@/app/date-calculations";
import type { Person } from "@/server/people";
import type { AdminPerson } from "@/server/admin-people-db";
import { formatPhoneNumber } from "./phone-number";
import { adminPeopleUrl } from "./admin-display";
import { ParentSelect } from "./ParentSelect";
import {
  getEligibleParents,
  getFullName,
  isValidDateOnly,
  PersonValidationError,
  validatePerson,
  validatePhoneNumber,
  validateSpouseDates,
} from "./person-validation";
import type { PersonValues } from "./person-validation";
import styles from "./admin.module.css";

const emptyValues: PersonValues = {
  firstName: "",
  lastName: "",
  birthday: "",
  deathday: "",
  spouse: "",
  phoneNumber: "",
  spouseBirthday: "",
  spouseDeathday: "",
  parentId: null,
};
const fields = [
  { name: "firstName", label: "First Name", type: "text", required: true },
  { name: "lastName", label: "Last Name", type: "text", required: true },
  { name: "birthday", label: "Birthday", type: "date", required: true },
  { name: "deathday", label: "Death Day", type: "date", required: false },
  { name: "parentId", label: "Parent", type: "parent", required: true },
  { name: "phoneNumber", label: "Phone Number", type: "tel", required: false },
  { name: "spouse", label: "Spouse", type: "text", required: false },
  {
    name: "spouseBirthday",
    label: "Spouse's Birthday",
    type: "date",
    required: false,
  },
  {
    name: "spouseDeathday",
    label: "Spouse's Death Day",
    type: "date",
    required: false,
  },
] as const;

function getToday(): string {
  return getLocalDateOnly(new Date());
}
function getServerToday(): null {
  return null;
}
function subscribeToToday(callback: () => void): () => void {
  const interval = window.setInterval(callback, 60_000);
  window.addEventListener("focus", callback);
  return () => {
    window.clearInterval(interval);
    window.removeEventListener("focus", callback);
  };
}

export function PersonForm({
  people,
  person,
  search,
}: {
  people: Person[];
  person?: AdminPerson;
  search: string;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PersonValues>(
    person
      ? {
          firstName: person.firstName,
          lastName: person.lastName,
          birthday: person.birthday,
          deathday: person.deathday ?? "",
          spouse: person.spouse ?? "",
          phoneNumber: formatPhoneNumber(person.phoneNumber),
          spouseBirthday: person.spouseBirthday ?? "",
          spouseDeathday: person.spouseDeathday ?? "",
          parentId: person.parentId,
        }
      : emptyValues,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof PersonValues, string>>
  >({});
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const [resetCount, setResetCount] = useState(0);
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const today = useSyncExternalStore(
    subscribeToToday,
    getToday,
    getServerToday,
  );
  const parentDisabled =
    person?.id === 1 ||
    !today ||
    !isValidDateOnly(values.birthday) ||
    values.birthday > today;
  const options = getEligibleParents(people, values.birthday, person?.id);
  const selectedParent =
    person?.id === 1
      ? undefined
      : people.find((candidate) => candidate.id === values.parentId);
  const returnUrl = adminPeopleUrl("/admin/people", search);

  function change(
    field: keyof PersonValues,
    value: string | number | null,
  ): void {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
    setMessage("");
  }

  function validateField(field: keyof PersonValues): void {
    try {
      // Validate new optional fields independently, even if required fields
      // elsewhere in the form are still empty.
      if (field === "phoneNumber") {
        const phoneNumber = validatePhoneNumber(values.phoneNumber);
        setValues((current) => ({
          ...current,
          phoneNumber: formatPhoneNumber(phoneNumber),
        }));
      } else if (field === "spouseBirthday" || field === "spouseDeathday") {
        validateSpouseDates(
          values.spouseBirthday,
          values.spouseDeathday,
          getToday(),
        );
        setErrors((current) => ({
          ...current,
          spouseBirthday: undefined,
          spouseDeathday: undefined,
        }));
      } else {
        validatePerson(values, people, getToday(), person?.id);
      }
    } catch (error: unknown) {
      if (
        error instanceof PersonValidationError &&
        error.field &&
        (error.field === field ||
          field === "spouseBirthday" ||
          field === "spouseDeathday")
      ) {
        const errorField = error.field;
        setErrors((current) => ({ ...current, [errorField]: error.message }));
      }
    }
  }

  async function submit(event: FormEvent<HTMLFormElement>): Promise<void> {
    event.preventDefault();
    if (submitting.current) return;
    setErrors({});
    setFormError("");
    setMessage("");
    let normalized: PersonValues;
    try {
      normalized = validatePerson(values, people, getToday(), person?.id);
    } catch (error: unknown) {
      if (error instanceof PersonValidationError) {
        if (error.field) {
          setErrors({ [error.field]: error.message });
          formRef.current
            ?.querySelector<HTMLInputElement>(`#${error.field}`)
            ?.focus();
        } else setFormError(error.message);
      }
      return;
    }
    submitting.current = true;
    setPending(true);
    try {
      const response = await fetch(
        person ? `/api/admin/people/${person.id}` : "/api/admin/people",
        {
          method: person ? "PUT" : "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(normalized),
        },
      );
      const result: unknown = await response.json();
      if (!response.ok) {
        if (
          typeof result === "object" &&
          result !== null &&
          "error" in result &&
          typeof result.error === "object" &&
          result.error !== null &&
          "message" in result.error &&
          typeof result.error.message === "string"
        ) {
          if ("code" in result.error && result.error.code === "NO_CHANGES")
            setMessage(result.error.message);
          else setFormError(result.error.message);
        } else setFormError("Something went wrong. Please try again.");
      } else if (person) {
        // A full navigation guarantees a fresh server read after the mutation,
        // including when the browser previously visited this filtered list.
        window.location.assign(returnUrl);
        return;
      } else {
        setValues(emptyValues);
        setResetCount((count) => count + 1);
        setMessage(
          `${getFullName(normalized)} was added. You may enter another Person.`,
        );
        router.refresh();
      }
    } catch {
      setFormError(
        "Unable to save. Please check your connection and try again.",
      );
    }
    submitting.current = false;
    setPending(false);
  }

  return (
    <form
      ref={formRef}
      onSubmit={submit}
      noValidate
      className={styles.form}
      aria-busy={pending}
    >
      <p>
        First Name, Last Name, Birthday
        {person?.id === 1 ? " are" : ", and Parent are"} required.
      </p>
      <div role="status">
        {message && <p className={styles.notice}>{message}</p>}
      </div>
      <div role="alert">
        {formError && <p className={styles.error}>{formError}</p>}
      </div>
      <fieldset disabled={pending}>
        {fields.map((field) =>
          field.name === "parentId" ? (
            <div key={field.name} className={styles.field}>
              <label htmlFor="parentId">Parent</label>
              <ParentSelect
                key={resetCount}
                options={options}
                selected={selectedParent}
                disabled={pending || Boolean(parentDisabled)}
                error={errors.parentId}
                onChange={(id) => change("parentId", id)}
                onBlur={() => validateField("parentId")}
              />
              <p id="parent-help" className={styles.help}>
                {person?.id === 1
                  ? "This Person has no Parent."
                  : parentDisabled
                    ? "Enter a valid Birthday to choose a Parent."
                    : "Select a Parent who was at least 15 years old on Birthday."}
              </p>
              {errors.parentId && (
                <p className={styles.error} id="parentId-error" role="alert">
                  {errors.parentId}
                </p>
              )}
            </div>
          ) : (
            <div key={field.name} className={styles.field}>
              <label htmlFor={field.name}>
                {field.label}
                {!field.required && (
                  <span className={styles.optional}> (optional)</span>
                )}
              </label>
              <input
                className={
                  field.name.startsWith("spouse")
                    ? styles.spouseInput
                    : undefined
                }
                id={field.name}
                name={field.name}
                type={field.type}
                required={field.required}
                max={field.type === "date" ? (today ?? undefined) : undefined}
                min={
                  field.name === "deathday" && isValidDateOnly(values.birthday)
                    ? values.birthday
                    : field.name === "spouseDeathday" &&
                        values.spouseBirthday &&
                        isValidDateOnly(values.spouseBirthday)
                      ? values.spouseBirthday
                      : undefined
                }
                value={values[field.name] ?? ""}
                onChange={(event) => change(field.name, event.target.value)}
                onBlur={() => validateField(field.name)}
                aria-invalid={Boolean(errors[field.name])}
                aria-describedby={
                  errors[field.name] ? `${field.name}-error` : undefined
                }
              />
              {errors[field.name] && (
                <p
                  className={styles.error}
                  id={`${field.name}-error`}
                  role="alert"
                >
                  {errors[field.name]}
                </p>
              )}
            </div>
          ),
        )}
      </fieldset>
      <div className={styles.actions}>
        <button className={styles.primary} type="submit" disabled={pending}>
          Save
        </button>
        <button
          type="button"
          disabled={pending}
          onClick={() => window.location.assign(returnUrl)}
        >
          {person ? "Cancel" : "Cancel/Return"}
        </button>
        {pending && <span role="status">Saving…</span>}
      </div>
    </form>
  );
}
