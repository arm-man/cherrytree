"use client";

import Image from "next/image";
import { useState, useSyncExternalStore } from "react";
import type { ReactNode } from "react";
import { DeceasedAge } from "./DeceasedAge";
import { PersonPhone } from "./PersonPhone";

import birthcake from "../../public/birthcake.jpg";
import cross from "../../public/cross.jpg";
import {
  formatAge,
  getLocalDateOnly,
  isUpcomingBirthday,
} from "./date-calculations";
import {
  filterPeopleBySearch,
  getFullName,
  getGenealogyGenerations,
  personMatchesSearch,
  SORT_OPTIONS,
  sortPeople,
} from "./people-calculations";
import type { SortOption } from "./people-calculations";
import {
  getAncestorSections,
  getListRows,
  getParentSection,
  getPublicRows,
  ROOT_PERSON_ID,
} from "./public-display";
import type {
  CherryKinRow,
  PublicAncestor,
  PublicPartner,
  PublicPerson,
  PublicRow,
} from "./public-display";

interface PersonListProps {
  people: PublicPerson[];
  partners: PublicPartner[];
  ancestors: PublicAncestor[];
}

interface PersonTableProps {
  ariaLabel: string;
  people: readonly PublicRow[];
  peopleById: ReadonlyMap<number, CherryKinRow>;
  showChildren?: boolean;
  showPassedAway?: boolean;
  showParent?: boolean;
  showPhone?: boolean;
  indentPartners?: boolean;
  today: string | null;
  isBirthdayHighlighted?: (person: PublicRow) => boolean;
  isRowHighlighted?: (person: PublicRow) => boolean;
  onPersonNameClick: (personId: number) => void;
  onSortChange?: (sortOption: SortOption) => void;
}

type View = "genealogy" | "list";

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

function isSortOption(value: string): value is SortOption {
  return SORT_OPTIONS.some((sortOption) => sortOption === value);
}

function PersonTable({
  ariaLabel,
  people,
  peopleById,
  showChildren = false,
  showPassedAway = false,
  showParent = false,
  showPhone = false,
  indentPartners = false,
  today,
  isBirthdayHighlighted,
  isRowHighlighted,
  onPersonNameClick,
  onSortChange,
}: PersonTableProps) {
  const columnCount =
    4 + Number(showChildren) + Number(showParent) + Number(showPassedAway);

  function renderColumnTitle(title: string, sortOption: SortOption): ReactNode {
    // Only the List table receives the existing dropdown's sort handler.
    if (!onSortChange) {
      return title;
    }

    return (
      <button
        type="button"
        className="column-sort-button"
        title={`Sort by ${sortOption === "Children" ? "# of Children" : sortOption}`}
        onClick={() => onSortChange(sortOption)}
      >
        {title}
      </button>
    );
  }

  return (
    <div className="table-scroll">
      <table
        aria-label={ariaLabel}
        className={showPassedAway ? "passing-table" : undefined}
      >
        <thead>
          <tr>
            <th scope="col">{renderColumnTitle("Name", "First Name")}</th>
            {showParent ? <th scope="col">Parent</th> : null}
            <th scope="col">{renderColumnTitle("Age", "Age")}</th>
            <th scope="col">{renderColumnTitle("Birthed", "Birthday")}</th>
            {showPassedAway ? <th scope="col">Passed Away</th> : null}
            {showChildren ? (
              <th scope="col">{renderColumnTitle("Children", "Children")}</th>
            ) : null}
            <th scope="col">{renderColumnTitle("Spouse", "Spouse")}</th>
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
                person.type !== "cherryKin" || person.parentId === null
                  ? undefined
                  : peopleById.get(person.parentId);
              const navigationPersonId = person.navigationPersonId;

              return (
                <tr
                  className={
                    isRowHighlighted?.(person) ? "highlighted-row" : undefined
                  }
                  key={person.rowKey}
                >
                  <td
                    className={
                      indentPartners && person.type === "partner"
                        ? "person-name partner-name"
                        : "person-name"
                    }
                  >
                    {navigationPersonId === null ? (
                      <span className="person-name-text">
                        {getFullName(person)}
                      </span>
                    ) : (
                      <button
                        type="button"
                        className="person-name-button"
                        onClick={() => onPersonNameClick(navigationPersonId)}
                      >
                        {getFullName(person)}
                      </button>
                    )}
                    {showPhone &&
                    person.type === "cherryKin" &&
                    person.phoneNumber !== null ? (
                      <PersonPhone
                        fullName={getFullName(person)}
                        phoneNumber={person.phoneNumber}
                      />
                    ) : null}
                  </td>
                  {showParent ? (
                    <td>{parent ? getFullName(parent) : ""}</td>
                  ) : null}
                  <td>
                    {today && person.birthday !== null ? (
                      person.deathday ? (
                        <DeceasedAge
                          birthday={person.birthday}
                          deathday={person.deathday}
                          deathDateLabel={formatDate(person.deathday)}
                          today={today}
                        />
                      ) : (
                        formatAge(person.birthday, null, today)
                      )
                    ) : (
                      ""
                    )}
                  </td>
                  <td
                    className={
                      isBirthdayHighlighted?.(person)
                        ? "highlighted-birthday"
                        : undefined
                    }
                  >
                    {person.birthday === null
                      ? ""
                      : formatDate(person.birthday)}
                  </td>
                  {showPassedAway ? (
                    <td>
                      {person.deathday === null
                        ? ""
                        : formatDate(person.deathday)}
                    </td>
                  ) : null}
                  {showChildren ? <td>{person.childCount ?? ""}</td> : null}
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

export function PersonList({
  people: sourcePeople,
  partners: sourcePartners,
  ancestors,
}: PersonListProps) {
  const { people, partners } = getPublicRows(sourcePeople, sourcePartners);
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
  const rootPerson = peopleById.get(rootPersonId);
  const parentSection = getParentSection(rootPerson, partners);
  const ancestorSections = getAncestorSections(
    rootPerson,
    peopleById,
    partners,
  );
  const generations = getGenealogyGenerations(people, rootPersonId);
  const filteredPeople = filterPeopleBySearch(
    getListRows(people, partners, ancestors),
    searchText,
  );
  const listPeople = today
    ? sortPeople(filteredPeople, listSort, today)
    : filteredPeople;

  function reset(): void {
    setView("genealogy");
    setRootPersonId(ROOT_PERSON_ID);
    setListSort("Birthday");
    setSearchText("");
  }

  function showPersonAsParent(personId: number): void {
    setRootPersonId(personId);
    setView("genealogy");
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
      <header className="public-header">
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
              loading="eager"
              unoptimized
            />
            <span className="wordmark-label">
              <span>Cherry</span> Tree
            </span>
          </button>
        </h1>

        <button
          type="button"
          className="passing-sort-button"
          aria-label="Sort by Date of Passing"
          title="Sort by Date of Passing"
          onClick={() => handleSortChange("Death Day")}
        >
          <Image
            className="passing-sort-icon"
            src={cross}
            alt=""
            loading="eager"
            unoptimized
          />
        </button>
      </header>

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
                {sortOption === "Death Day"
                  ? "Date of Passing"
                  : sortOption === "Children"
                    ? "# of Children"
                    : sortOption}
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
          onSortChange={handleSortChange}
          people={listPeople}
          peopleById={peopleById}
          showChildren
          showPassedAway={listSort === "Death Day"}
          today={today}
          isBirthdayHighlighted={
            listSort === "Upcoming Birthday" && today
              ? (person) =>
                  person.birthday !== null &&
                  isUpcomingBirthday(person.birthday, today)
              : undefined
          }
          onPersonNameClick={showPersonAsParent}
        />
      ) : (
        <div className="genealogy-view">
          {ancestorSections.map((section) => (
            <section className="generation" key={section.title}>
              <h2>{section.title}</h2>
              <PersonTable
                ariaLabel={section.title}
                showPhone
                indentPartners={section.rows.length > 2}
                people={section.rows}
                peopleById={peopleById}
                today={today}
                isRowHighlighted={(person) =>
                  personMatchesSearch(person, searchText)
                }
                onPersonNameClick={showPersonAsParent}
              />
            </section>
          ))}

          <section className="generation root-generation">
            <PersonTable
              ariaLabel="Selected Cherry Kin and Spouses"
              showPhone
              indentPartners={parentSection.rows.length > 2}
              people={parentSection.rows}
              peopleById={peopleById}
              today={today}
              isRowHighlighted={(person) =>
                personMatchesSearch(person, searchText)
              }
              onPersonNameClick={showPersonAsParent}
            />
          </section>

          <section className="generation">
            <h2>Children ({generations.children.length})</h2>
            {generations.children.length === 0 ? (
              <p className="empty-generation">No Children</p>
            ) : (
              <PersonTable
                ariaLabel="Children"
                showPhone
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
                showPhone
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
                showPhone
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
                showPhone
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
