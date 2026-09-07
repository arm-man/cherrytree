"use client";

import { useRouter } from "next/navigation";
import { useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { calculateAge, getLocalDateOnly } from "@/app/date-calculations";
import type { AdminPerson } from "@/server/admin-people-db";
import type { AdminRowFilter } from "../people/admin-display";
import { adminPeopleUrl, formatAdminDate } from "../people/admin-display";
import {
  getFullName,
  isValidDateOnly,
  sortByFullName,
} from "../people/person-validation";
import { PartnerValidationError, validatePartner } from "./partner-validation";
import type { AdminPartner, PartnerValues } from "./partner-validation";
import styles from "../people/admin.module.css";

const emptyValues: PartnerValues = {
  firstName: "",
  lastName: "",
  birthday: "",
  deathday: "",
  partnerId: 0,
};
const fields = [
  { name: "firstName", label: "First Name", type: "text", required: true },
  { name: "lastName", label: "Last Name", type: "text", required: true },
  { name: "birthday", label: "Birthday", type: "date", required: false },
  { name: "deathday", label: "Death Day", type: "date", required: false },
  { name: "partnerId", label: "Spouse", type: "partner", required: true },
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

export function PartnerForm({
  people,
  partner,
  search,
  type,
}: {
  people: AdminPerson[];
  partner?: AdminPartner;
  search: string;
  type: AdminRowFilter;
}) {
  const router = useRouter();
  const [values, setValues] = useState<PartnerValues>(
    partner
      ? {
          firstName: partner.firstName,
          lastName: partner.lastName,
          birthday: partner.birthday ?? "",
          deathday: partner.deathday ?? "",
          partnerId: partner.partnerId,
        }
      : emptyValues,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof PartnerValues, string>>
  >({});
  const [message, setMessage] = useState("");
  const [formError, setFormError] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);
  const today = useSyncExternalStore(
    subscribeToToday,
    getToday,
    getServerToday,
  );
  const options = sortByFullName(
    today
      ? people.filter(
          (person) =>
            calculateAge(person.birthday, person.deathday ?? today) >= 16,
        )
      : [],
  );
  const returnUrl = adminPeopleUrl("/admin/people", search, type);

  function change(
    field: keyof PartnerValues,
    value: string | number | null,
  ): void {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
    setMessage("");
  }

  function validateField(field: keyof PartnerValues): void {
    try {
      validatePartner(values, options, getToday());
      setErrors((current) => ({ ...current, [field]: undefined }));
    } catch (error: unknown) {
      if (
        error instanceof PartnerValidationError &&
        error.field &&
        error.field === field
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
    let normalized: PartnerValues;
    try {
      normalized = validatePartner(values, options, getToday());
    } catch (error: unknown) {
      if (error instanceof PartnerValidationError) {
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
        partner ? `/api/admin/partners/${partner.id}` : "/api/admin/partners",
        {
          method: partner ? "PUT" : "POST",
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
      } else if (partner) {
        // A full navigation guarantees a fresh server read after the mutation,
        // including when the browser previously visited this filtered list.
        window.location.assign(returnUrl);
        return;
      } else {
        setValues(emptyValues);
        setMessage(
          `${getFullName(normalized)} was added. You may enter another Spouse.`,
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
      <p>First Name, Last Name, and Spouse are required.</p>
      <div role="status">
        {message && <p className={styles.notice}>{message}</p>}
      </div>
      <div role="alert">
        {formError && <p className={styles.error}>{formError}</p>}
      </div>
      <fieldset disabled={pending}>
        {fields.map((field) =>
          field.name === "partnerId" ? (
            <div key={field.name} className={styles.field}>
              <label htmlFor="partnerId">Spouse</label>
              <select
                id="partnerId"
                name="partnerId"
                required
                disabled={!today}
                value={
                  options.some((option) => option.id === values.partnerId)
                    ? values.partnerId
                    : ""
                }
                onChange={(event) =>
                  change("partnerId", Number(event.target.value))
                }
                onBlur={() => validateField("partnerId")}
                aria-invalid={Boolean(errors.partnerId)}
                aria-describedby={
                  errors.partnerId ? "partnerId-error" : undefined
                }
              >
                <option value="">Select a Cherry Kin</option>
                {options.map((option) => (
                  <option key={option.id} value={option.id}>
                    {`${getFullName(option)} — ${formatAdminDate(option.birthday)}`}
                  </option>
                ))}
              </select>
              {errors.partnerId && (
                <p className={styles.error} id="partnerId-error" role="alert">
                  {errors.partnerId}
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
                id={field.name}
                name={field.name}
                type={field.type}
                required={field.required}
                max={field.type === "date" ? (today ?? undefined) : undefined}
                min={
                  field.name === "deathday" &&
                  values.birthday &&
                  isValidDateOnly(values.birthday)
                    ? values.birthday
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
          Cancel/Return
        </button>
        {pending && <span role="status">Saving…</span>}
      </div>
    </form>
  );
}
