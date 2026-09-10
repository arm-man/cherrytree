"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import type { AdminListRow } from "./admin-display";
import {
  adminPeopleUrl,
  filterAdminRows,
  parseAdminRowFilter,
} from "./admin-display";
import styles from "./admin.module.css";

export function AdminPeopleList({ rows }: { rows: AdminListRow[] }) {
  const params = useSearchParams();
  const search = params.get("search") ?? "";
  const type = parseAdminRowFilter(params.get("type"));
  const router = useRouter();
  const matches = filterAdminRows(rows, search, type);

  return (
    <>
      <div className={styles.heading}>
        <h1>Cherry Kin, Spouses &amp; Ancestors</h1>
        <div className={styles.actions}>
          <Link
            className={styles.primary}
            href={adminPeopleUrl("/admin/people/new", search, type)}
            prefetch={false}
          >
            Add Cherry Kin
          </Link>
          <Link
            className={styles.primary}
            href={adminPeopleUrl("/admin/partners/new", search, type)}
            prefetch={false}
          >
            Add Spouse
          </Link>
          <Link
            className={styles.primary}
            href={adminPeopleUrl("/admin/ancestors/new", search, type)}
            prefetch={false}
          >
            Add Ancestor
          </Link>
        </div>
      </div>
      <div className={styles.search}>
        <div className={styles.field}>
          <label htmlFor="people-search">Search</label>
          <input
            id="people-search"
            type="search"
            placeholder="Search all columns"
            value={search}
            onChange={(event) =>
              window.history.replaceState(
                null,
                "",
                adminPeopleUrl("/admin/people", event.target.value, type),
              )
            }
          />
        </div>
        <div className={styles.field}>
          <label htmlFor="row-type">Type</label>
          <select
            id="row-type"
            value={type}
            onChange={(event) =>
              window.history.replaceState(
                null,
                "",
                adminPeopleUrl(
                  "/admin/people",
                  search,
                  parseAdminRowFilter(event.target.value),
                ),
              )
            }
          >
            <option value="all">All</option>
            <option value="cherryKin">Cherry Kin</option>
            <option value="spouse">Spouse</option>
            <option value="ancestor">Ancestor</option>
          </select>
        </div>
      </div>
      <div
        className="table-scroll"
        role="region"
        aria-label="Cherry Kin, Spouses & Ancestors"
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
                "Phone Number",
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
              const href = adminPeopleUrl(
                `/admin/${person.type === "cherryKin" ? "people" : person.type === "spouse" ? "partners" : "ancestors"}/${person.id}/edit`,
                search,
                type,
              );
              return (
                <tr
                  key={`${person.type}-${person.id}`}
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
                      {person.fullName}
                    </Link>
                  </td>
                  <td>{person.birthday}</td>
                  <td>{person.deathday}</td>
                  <td>{person.parentName}</td>
                  <td>{person.phoneNumber}</td>
                  <td>{person.spouseName}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p role="status" className={styles.listStatus}>
        {matches.length === 0
          ? "No Cherry Kin, Spouses or Ancestors found."
          : `${matches.length} ${matches.length === 1 ? "record" : "records"}`}
      </p>
    </>
  );
}
