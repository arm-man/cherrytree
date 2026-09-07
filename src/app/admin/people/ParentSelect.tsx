"use client";

import { useEffect, useRef, useState } from "react";
import type { AdminPerson } from "@/server/admin-people-db";
import { formatAdminDate } from "./admin-display";
import { getFullName } from "./person-validation";
import styles from "./admin.module.css";

function optionLabel(person: AdminPerson): string {
  return `${getFullName(person)} — ${formatAdminDate(person.birthday)}`;
}

export function ParentSelect({
  options,
  selected,
  disabled,
  error,
  onChange,
  onBlur,
}: {
  options: AdminPerson[];
  selected: AdminPerson | undefined;
  disabled: boolean;
  error?: string;
  onChange: (id: number | null) => void;
  onBlur: () => void;
}) {
  const [query, setQuery] = useState<string | null>(null);
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<number | null>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const matches = options.filter((person) =>
    optionLabel(person)
      .toLocaleLowerCase()
      .includes((query ?? "").trim().toLocaleLowerCase()),
  );
  const activeIndex = Math.max(
    0,
    matches.findIndex((person) => person.id === activeId),
  );
  const active = matches[activeIndex];
  const expanded = open && !disabled;

  useEffect(() => {
    if (expanded && active)
      listRef.current
        ?.querySelector(`[id="parent-option-${active.id}"]`)
        ?.scrollIntoView({ block: "nearest" });
  }, [expanded, active]);

  function select(person: AdminPerson): void {
    onChange(person.id);
    setQuery(null);
    setOpen(false);
  }

  return (
    <div className={styles.parentSelect}>
      <input
        id="parentId"
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={expanded}
        aria-controls={expanded ? "parent-options" : undefined}
        aria-activedescendant={
          expanded && active ? `parent-option-${active.id}` : undefined
        }
        aria-invalid={Boolean(error)}
        aria-describedby={`parent-help${error ? " parentId-error" : ""}`}
        aria-required={!disabled}
        autoComplete="off"
        disabled={disabled}
        placeholder={disabled ? "" : "Search and select a Parent"}
        value={
          disabled
            ? selected
              ? optionLabel(selected)
              : ""
            : (query ?? (selected ? optionLabel(selected) : ""))
        }
        onFocus={() => setOpen(true)}
        onClick={() => setOpen(true)}
        onChange={(event) => {
          setQuery(event.target.value);
          setOpen(true);
          setActiveId(null);
          onChange(null);
        }}
        onBlur={() => {
          setOpen(false);
          onBlur();
        }}
        onKeyDown={(event) => {
          if (event.key === "Escape") {
            event.preventDefault();
            setOpen(false);
          }
          if (event.key === "ArrowDown" || event.key === "ArrowUp") {
            event.preventDefault();
            setOpen(true);
            const direction = event.key === "ArrowDown" ? 1 : -1;
            const index = expanded
              ? (activeIndex + direction + matches.length) % matches.length
              : 0;
            setActiveId(matches[index]?.id ?? null);
          }
          if (event.key === "Enter" && expanded) {
            event.preventDefault();
            if (active) select(active);
          }
        }}
      />
      {expanded && (
        <ul
          id="parent-options"
          ref={listRef}
          role="listbox"
          aria-label="Parent options"
          className={styles.options}
        >
          {matches.map((person) => (
            <li
              key={person.id}
              id={`parent-option-${person.id}`}
              role="option"
              aria-selected={selected?.id === person.id}
              data-active={active?.id === person.id}
              onPointerDown={(event) => event.preventDefault()}
              onClick={() => select(person)}
            >
              {optionLabel(person)}
            </li>
          ))}
          {matches.length === 0 && (
            <li role="presentation">No eligible parents found.</li>
          )}
        </ul>
      )}
    </div>
  );
}
