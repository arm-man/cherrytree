"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { filterPeopleBySearch } from "@/app/people-calculations";
import type { Person } from "@/server/people";
import { adminPeopleUrl, formatAdminDate } from "./admin-display";
import { getFullName } from "./person-validation";
import styles from "./admin.module.css";

export function AdminPeopleList({ people }: { people: Person[] }) {
  const search = useSearchParams().get("search") ?? "";
  const router = useRouter();
  const matches = filterPeopleBySearch(people, search);
  const peopleById = new Map(people.map((person) => [person.id, person]));

  return (
    <>
      <div className={styles.heading}>
        <h1>People</h1>
        <Link
          className={styles.primary}
          href={adminPeopleUrl("/admin/people/new", search)}
          prefetch={false}
        >
          Add Person
        </Link>
      </div>
      <div className={styles.search}>
        <label htmlFor="people-search">Search</label>
        <input
          id="people-search"
          type="search"
          placeholder="Search for a name"
          value={search}
          onChange={(event) =>
            window.history.replaceState(
              null,
              "",
              adminPeopleUrl("/admin/people", event.target.value),
            )
          }
        />
      </div>
      <div
        className="table-scroll"
        role="region"
        aria-label="People"
        tabIndex={0}
      >
        <table className={styles.table}>
          <thead>
            <tr>
              {[
                "Full Name",
                "Birthday",
                "Death Day",
                "Parent's Full Name",
                "Spouse",
              ].map((label) => (
                <th key={label} scope="col">
                  {label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {matches.map((person) => {
              const parent = peopleById.get(person.parentId ?? 0);
              const href = adminPeopleUrl(
                `/admin/people/${person.id}/edit`,
                search,
              );
              return (
                <tr
                  key={person.id}
                  onClick={(event) => {
                    // Keep the native link's keyboard, new-tab, and context-menu behavior.
                    if (
                      event.target instanceof Element &&
                      !event.target.closest("a") &&
                      !window.getSelection()?.toString()
                    )
                      router.push(href);
                  }}
                >
                  <td>
                    <Link href={href} prefetch={false}>
                      {getFullName(person)}
                    </Link>
                  </td>
                  <td>{formatAdminDate(person.birthday)}</td>
                  <td>{formatAdminDate(person.deathday)}</td>
                  <td>{parent ? getFullName(parent) : ""}</td>
                  <td>{person.spouse ?? ""}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p role="status" className={styles.listStatus}>
        {matches.length === 0
          ? "No people found."
          : `${matches.length} ${matches.length === 1 ? "Person" : "People"}`}
      </p>
    </>
  );
}
