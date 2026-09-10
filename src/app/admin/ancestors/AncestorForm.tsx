"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import type { FormEvent } from "react";
import { getLocalDateOnly } from "@/app/date-calculations";
import type { AdminRowFilter } from "../people/admin-display";
import { adminPeopleUrl } from "../people/admin-display";
import { isValidDateOnly } from "../people/person-validation";
import {
  AncestorValidationError,
  validateAncestor,
} from "./ancestor-validation";
import type { AdminAncestor, AncestorValues } from "./ancestor-validation";
import styles from "../people/admin.module.css";

const emptyValues: AncestorValues = {
  firstName: "",
  lastName: "",
  birthday: "",
  deathday: "",
  spouse: "",
};
const fields = [
  { name: "firstName", label: "First Name", type: "text", required: true },
  { name: "lastName", label: "Last Name", type: "text", required: true },
  { name: "birthday", label: "Birthday", type: "date", required: true },
  { name: "deathday", label: "Death Day", type: "date", required: false },
  { name: "spouse", label: "Spouse", type: "text", required: false },
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

export function AncestorForm({
  ancestor,
  search,
  type,
}: {
  ancestor?: AdminAncestor;
  search: string;
  type: AdminRowFilter;
}) {
  const [values, setValues] = useState<AncestorValues>(
    ancestor
      ? {
          firstName: ancestor.firstName,
          lastName: ancestor.lastName,
          birthday: ancestor.birthday ?? "",
          deathday: ancestor.deathday ?? "",
          spouse: ancestor.spouse ?? "",
        }
      : emptyValues,
  );
  const [errors, setErrors] = useState<
    Partial<Record<keyof AncestorValues, string>>
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
  const returnUrl = adminPeopleUrl("/admin/people", search, type);

  function change(field: keyof AncestorValues, value: string): void {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setFormError("");
    setMessage("");
  }

  function validateField(field: keyof AncestorValues): void {
    try {
      validateAncestor(values, getToday());
      setErrors((current) => ({ ...current, [field]: undefined }));
    } catch (error: unknown) {
      if (
        error instanceof AncestorValidationError &&
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
    let normalized: AncestorValues;
    try {
      normalized = validateAncestor(values, getToday());
    } catch (error: unknown) {
      if (error instanceof AncestorValidationError) {
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
        ancestor
          ? `/api/admin/ancestors/${ancestor.id}`
          : "/api/admin/ancestors",
        {
          method: ancestor ? "PUT" : "POST",
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
      } else {
        // A full navigation guarantees a fresh server read after the mutation,
        // including when the browser previously visited this filtered list.
        window.location.assign(returnUrl);
        return;
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
      <p>First Name, Last Name, and Birthday are required.</p>
      <div role="status">
        {message && <p className={styles.notice}>{message}</p>}
      </div>
      <div role="alert">
        {formError && <p className={styles.error}>{formError}</p>}
      </div>
      <fieldset disabled={pending}>
        {fields.map((field) => (
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
        ))}
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
