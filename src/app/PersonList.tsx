"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";

import birthcake from "../../public/birthcake.jpg";
import {
  formatAge,
  getLocalDateOnly,
  isUpcomingBirthday,
} from "./date-calculations";
import {
  filterPeopleBySearch,
  getChildCounts,
  getGenealogyGenerations,
  personMatchesSearch,
  SORT_OPTIONS,
  sortPeople,
} from "./people-calculations";
import type { SortOption } from "./people-calculations";

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
  isBirthdayHighlighted?: (person: PersonListItem) => boolean;
  isRowHighlighted?: (person: PersonListItem) => boolean;
  onPersonNameClick: (person: PersonListItem) => void;
}

type View = "genealogy" | "list";

const ROOT_PERSON_ID = 1;
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

function isSortOption(value: string): value is SortOption {
  return SORT_OPTIONS.some((sortOption) => sortOption === value);
}

function PersonTable({
  ariaLabel,
  people,
  peopleById,
  showChildren = false,
  showParent = false,
  today,
  isBirthdayHighlighted,
  isRowHighlighted,
  onPersonNameClick,
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
                <tr
                  className={
                    isRowHighlighted?.(person) ? "highlighted-row" : undefined
                  }
                  key={person.id}
                >
                  <td className="person-name">
                    <button
                      type="button"
                      className="person-name-button"
                      onClick={() => onPersonNameClick(person)}
                    >
                      {getFullName(person)}
                    </button>
                  </td>
                  {showParent ? (
                    <td>{parent ? getFullName(parent) : ""}</td>
                  ) : null}
                  <td>
                    {today
                      ? formatAge(person.birthday, person.deathday, today)
                      : ""}
                  </td>
                  <td
                    className={
                      isBirthdayHighlighted?.(person)
                        ? "highlighted-birthday"
                        : undefined
                    }
                  >
                    {formatDate(person.birthday)}
                  </td>
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
  const [rootPersonId, setRootPersonId] = useState(ROOT_PERSON_ID);
  const [listSort, setListSort] = useState<SortOption>("Birthday");
  const [searchText, setSearchText] = useState("");
  // Avoid using the server's date during prerendering because today is defined by
  // the browser's local calendar. The subscription also refreshes at local midnight.
  const today = useSyncExternalStore(
    subscribeToDateChange,
    getToday,
    getServerToday,
  );
  const peopleById = new Map(people.map((person) => [person.id, person]));
  const childCounts = getChildCounts(people);
  const rootPerson = peopleById.get(rootPersonId);
  const generations = getGenealogyGenerations(people, rootPersonId);
  const filteredPeople = filterPeopleBySearch(people, searchText);
  const listPeople = today
    ? sortPeople(filteredPeople, listSort, today, childCounts)
    : filteredPeople;

  function reset(): void {
    setView("genealogy");
    setRootPersonId(ROOT_PERSON_ID);
    setListSort("Birthday");
    setSearchText("");
  }

  function showPersonAsParent(person: PersonListItem): void {
    setRootPersonId(person.id);
    setView("genealogy");
  }

  function handleParentNameClick(person: PersonListItem): void {
    if (person.parentId !== null) {
      setRootPersonId(person.parentId);
    }
  }

  function handleSortChange(value: string): void {
    if (!isSortOption(value)) {
      return;
    }

    setListSort(value);
    setView("list");
  }

  return (
    <>
      <h1 className="wordmark-heading">
        <button
          type="button"
          className="wordmark"
          aria-label="Reset Cherry Tree"
          onClick={reset}
        >
          <Image
            className="wordmark-icon"
            src={birthcake}
            alt=""
            preload
            unoptimized
          />
          <span className="wordmark-label">
            <span>Cherry</span> Tree
          </span>
        </button>
      </h1>

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
            value={view === "genealogy" ? "" : listSort}
            onChange={(event) => handleSortChange(event.target.value)}
          >
            <option value="" aria-label="None" disabled />
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
            value={searchText}
            onChange={(event) => setSearchText(event.target.value)}
          />
        </div>
      </section>

      {view === "list" ? (
        <PersonTable
          ariaLabel="People"
          people={listPeople}
          peopleById={peopleById}
          showChildren
          today={today}
          isBirthdayHighlighted={
            listSort === "Upcoming Birthday" && today
              ? (person) => isUpcomingBirthday(person.birthday, today)
              : undefined
          }
          onPersonNameClick={showPersonAsParent}
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
              isRowHighlighted={(person) =>
                personMatchesSearch(person, searchText)
              }
              onPersonNameClick={handleParentNameClick}
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
                isRowHighlighted={(person) =>
                  personMatchesSearch(person, searchText)
                }
                onPersonNameClick={showPersonAsParent}
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
                isRowHighlighted={(person) =>
                  personMatchesSearch(person, searchText)
                }
                onPersonNameClick={showPersonAsParent}
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
                isRowHighlighted={(person) =>
                  personMatchesSearch(person, searchText)
                }
                onPersonNameClick={showPersonAsParent}
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
                isRowHighlighted={(person) =>
                  personMatchesSearch(person, searchText)
                }
                onPersonNameClick={showPersonAsParent}
              />
            </section>
          ) : null}
        </div>
      )}
    </>
  );
}
