"use client";

interface PersonListItem {
  id: number;
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

export function PersonList({ people }: PersonListProps) {
  return (
    <div className="table-scroll">
      <table aria-label="People">
        <thead>
          <tr>
            <th scope="col">Name</th>
            <th scope="col">Birthday</th>
            <th scope="col">Death Day</th>
            <th scope="col">Spouse</th>
          </tr>
        </thead>
        <tbody>
          {people.length === 0 ? (
            <tr>
              <td className="empty-table" colSpan={4}>
                No people found.
              </td>
            </tr>
          ) : (
            people.map((person) => (
              <tr key={person.id}>
                <td className="person-name">
                  {`${person.firstName} ${person.lastName}`}
                </td>
                <td>{formatDate(person.birthday)}</td>
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
