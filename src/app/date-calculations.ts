interface CalendarDate {
  year: number;
  month: number;
  day: number;
}

const DAYS_BEFORE_MONTH = [
  0, 0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334,
];

function parseDateOnly(date: string): CalendarDate {
  const [year, month, day] = date.split("-").map(Number);

  return { year, month, day };
}

function isLeapYear(year: number): boolean {
  return year % 4 === 0 && (year % 100 !== 0 || year % 400 === 0);
}

function getDayOfYear(date: CalendarDate): number {
  const leapDay = date.month > 2 && isLeapYear(date.year) ? 1 : 0;

  return DAYS_BEFORE_MONTH[date.month] + leapDay + date.day;
}

function getDaysInYear(year: number): number {
  return isLeapYear(year) ? 366 : 365;
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

  return `${calculateAge(birthday, deathday)} †`;
}

export function getDaysUntilNextBirthday(
  birthday: string,
  today: string,
): number {
  const birthDate = parseDateOnly(birthday);
  const todayDate = parseDateOnly(today);
  const birthdayHasNotPassed =
    birthDate.month > todayDate.month ||
    (birthDate.month === todayDate.month && birthDate.day >= todayDate.day);
  const nextBirthdayYear = birthdayHasNotPassed
    ? todayDate.year
    : todayDate.year + 1;
  const nextBirthday = { ...birthDate, year: nextBirthdayYear };

  if (nextBirthdayYear === todayDate.year) {
    return getDayOfYear(nextBirthday) - getDayOfYear(todayDate);
  }

  return (
    getDaysInYear(todayDate.year) -
    getDayOfYear(todayDate) +
    getDayOfYear(nextBirthday)
  );
}

export function isUpcomingBirthday(birthday: string, today: string): boolean {
  return getDaysUntilNextBirthday(birthday, today) < 7;
}
