interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

function parseDateOnly(date: string): CalendarDate {
  const [year, month, day] = date.split("-").map(Number);

  return { year, month, day };
}

export function getLocalDateOnly(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function calculateAge(birthday: string, onDate: string): number {
  const birthDate = parseDateOnly(birthday);
  const ageDate = parseDateOnly(onDate);
  const birthdayHasOccurred =
    ageDate.month > birthDate.month ||
    (ageDate.month === birthDate.month && ageDate.day >= birthDate.day);

  return ageDate.year - birthDate.year - (birthdayHasOccurred ? 0 : 1);
}

export function formatAge(
  birthday: string,
  deathday: string | null,
  today: string,
): string {
  const currentAge = calculateAge(birthday, today);

  if (!deathday) {
    return String(currentAge);
  }

  return `${calculateAge(birthday, deathday)} (${currentAge})`;
}
