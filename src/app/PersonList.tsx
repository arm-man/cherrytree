"use client";

import { useSyncExternalStore } from "react";

import { formatAge, getLocalDateOnly } from "./date-calculations";
import { getChildCounts } from "./people-calculations";

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

export function PersonList({ people }: PersonListProps) {
  // Avoid using the server's date during prerendering because today is defined by
  // the browser's local calendar. The subscription also refreshes at local midnight.
  const today = useSyncExternalStore(
    subscribeToDateChange,
    getToday,
    getServerToday,
  );
  const childCounts = getChildCounts(people);

  return (
    <div className="table-scroll">
      <table aria-label="People">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Age</th>
            <th scope="col">Birthday</th>
            <th scope="col">Children</th>
            <th scope="col">Death Day</th>
            <th scope="col">Spouse</th>
          </tr>
        </thead>
        <tbody>
          {people.length === 0 ? (
            <tr>
              <td className="empty-table" colSpan={6}>
                No people found.
              </td>
            </tr>
          ) : (
            people.map((person) => (
              <tr key={person.id}>
                <td className="person-name">
                  {`${person.firstName} ${person.lastName}`}
                </td>
                <td>
                  {today
                    ? formatAge(person.birthday, person.deathday, today)
                    : ""}
                </td>
                <td>{formatDate(person.birthday)}</td>
                <td>{childCounts.get(person.id) ?? 0}</td>
                <td>{person.deathday ? formatDate(person.deathday) : ""}</td>
                <td>{person.spouse ?? ""}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
