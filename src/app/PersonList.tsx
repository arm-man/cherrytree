"use client";

import { useState, useSyncExternalStore } from "react";

import { formatAge, getLocalDateOnly } from "./date-calculations";
import {
  getChildCounts,
  getGenealogyGenerations,
} from "./people-calculations";

interface PersonListItem {
  id: number;
  parentId: number | null;
  firstName: string;
  lastName: string;
  birthday: string;
  deathday: string | null;
  spouse: string | null;
}

interface PersonListProps {
  people: PersonListItem[];
}

interface PersonTableProps {
  ariaLabel: string;
  people: readonly PersonListItem[];
  peopleById: ReadonlyMap<number, PersonListItem>;
  showChildren?: boolean;
  showParent?: boolean;
  today: string | null;
}

type View = "genealogy" | "list";

const ROOT_PERSON_ID = 1;
const SORT_OPTIONS = [
  "Birthday",
  "Upcoming Birthday",
  "Death Day",
  "First Name",
  "Last Name",
  "Spouse",
  "Children",
];
const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function formatDate(date: string): string {
  const [year, month, day] = date.split("-").map(Number);

  return `${MONTH_NAMES[month - 1]} ${day}, ${year}`;
}

function getFullName(person: PersonListItem): string {
  return `${person.firstName} ${person.lastName}`;
}

function getToday(): string {
  return getLocalDateOnly(new Date());
}

function subscribeToDateChange(onDateChange: () => void): () => void {
  let timeoutId: number;

  function scheduleNextDay(): void {
    const now = new Date();
    const nextDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    );

    timeoutId = window.setTimeout(() => {
      onDateChange();
      scheduleNextDay();
    }, nextDay.getTime() - now.getTime());
  }

  scheduleNextDay();

  return () => window.clearTimeout(timeoutId);
}

function getServerToday(): null {
  return null;
}

function PersonTable({
  ariaLabel,
  people,
  peopleById,
  showChildren = false,
  showParent = false,
  today,
}: PersonTableProps) {
  const childCounts = showChildren
    ? getChildCounts([...peopleById.values()])
    : null;
  const columnCount = 5 + Number(showChildren) + Number(showParent);

  return (
    <div className="table-scroll">
      <table aria-label={ariaLabel}>
        <thead>
          <tr>
            <th scope="col">Name</th>
            {showParent ? <th scope="col">Parent</th> : null}
            <th scope="col">Age</th>
            <th scope="col">Birthed</th>
            {showChildren ? <th scope="col">Children</th> : null}
            <th scope="col">Death Day</th>
            <th scope="col">Spouse</th>
          </tr>
        </thead>
        <tbody>
          {people.length === 0 ? (
            <tr>
              <td className="empty-table" colSpan={columnCount}>
                No people found.
              </td>
            </tr>
          ) : (
            people.map((person) => {
              const parent =
                person.parentId === null
                  ? undefined
                  : peopleById.get(person.parentId);

              return (
                <tr key={person.id}>
                  <td className="person-name">{getFullName(person)}</td>
                  {showParent ? (
                    <td>{parent ? getFullName(parent) : ""}</td>
                  ) : null}
                  <td>
                    {today
                      ? formatAge(person.birthday, person.deathday, today)
                      : ""}
                  </td>
                  <td>{formatDate(person.birthday)}</td>
                  {showChildren ? (
                    <td>{childCounts?.get(person.id) ?? 0}</td>
                  ) : null}
                  <td>{person.deathday ? formatDate(person.deathday) : ""}</td>
                  <td>{person.spouse ?? ""}</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PersonList({ people }: PersonListProps) {
  const [view, setView] = useState<View>("genealogy");
  // Avoid using the server's date during prerendering because today is defined by
  // the browser's local calendar. The subscription also refreshes at local midnight.
  const today = useSyncExternalStore(
    subscribeToDateChange,
    getToday,
    getServerToday,
  );
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const rootPerson = peopleById.get(ROOT_PERSON_ID);
  const generations = getGenealogyGenerations(people, ROOT_PERSON_ID);

  return (
    <>
      <section className="controls" aria-label="Controls">
        <div className="control-field">
          <span className="control-label">View</span>
          <div className="view-toggle" role="group" aria-label="View">
            <button
              type="button"
              aria-pressed={view === "genealogy"}
              onClick={() => setView("genealogy")}
            >
              Genealogy
            </button>
            <button
              type="button"
              aria-pressed={view === "list"}
              onClick={() => setView("list")}
            >
              List
            </button>
          </div>
        </div>

        <div className="control-field">
          <label className="control-label" htmlFor="sort">
            Sort
          </label>
          <select
            id="sort"
            className="control-input"
            value={view === "genealogy" ? "" : "Birthday"}
            disabled
          >
            <option value="" aria-label="None" />
            {SORT_OPTIONS.map((sortOption) => (
              <option key={sortOption} value={sortOption}>
                {sortOption}
              </option>
            ))}
          </select>
        </div>

        <div className="control-field search-field">
          <label className="control-label" htmlFor="search">
            Search
          </label>
          <input
            id="search"
            className="control-input"
            type="search"
            placeholder="Search for a name"
            disabled
          />
        </div>
      </section>

      {view === "list" ? (
        <PersonTable
          ariaLabel="People"
          people={people}
          peopleById={peopleById}
          showChildren
          today={today}
        />
      ) : (
        <div className="genealogy-view">
          <section className="generation">
            <h2>Parent</h2>
            <PersonTable
              ariaLabel="Parent"
              people={rootPerson ? [rootPerson] : []}
              peopleById={peopleById}
              today={today}
            />
          </section>

          <section className="generation">
            <h2>Children ({generations.children.length})</h2>
            {generations.children.length === 0 ? (
              <p className="empty-generation">No Children</p>
            ) : (
              <PersonTable
                ariaLabel="Children"
                people={generations.children}
                peopleById={peopleById}
                today={today}
              />
            )}
          </section>

          {generations.grandchildren.length > 0 ? (
            <section className="generation">
              <h2>Grandchildren ({generations.grandchildren.length})</h2>
              <PersonTable
                ariaLabel="Grandchildren"
                people={generations.grandchildren}
                peopleById={peopleById}
                showParent
                today={today}
              />
            </section>
          ) : null}

          {generations.greatGrandchildren.length > 0 ? (
            <section className="generation">
              <h2>
                Great Grandchildren ({generations.greatGrandchildren.length})
              </h2>
              <PersonTable
                ariaLabel="Great Grandchildren"
                people={generations.greatGrandchildren}
                peopleById={peopleById}
                showParent
                today={today}
              />
            </section>
          ) : null}

          {generations.greatGreatGrandchildren.length > 0 ? (
            <section className="generation">
              <h2>
                Great Great Grandchildren (
                {generations.greatGreatGrandchildren.length})
              </h2>
              <PersonTable
                ariaLabel="Great Great Grandchildren"
                people={generations.greatGreatGrandchildren}
                peopleById={peopleById}
                showParent
                today={today}
              />
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
