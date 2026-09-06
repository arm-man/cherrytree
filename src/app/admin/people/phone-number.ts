// Strip ordinary U.S. formatting only; letters, extensions and country codes
// must remain invalid instead of silently becoming a different phone number.
export function normalizePhoneNumber(value: string): string {
  return value.replace(/[ ().\-]/g, "");
}

export function isValidPhoneNumber(value: string): boolean {
  return /^\d{10}$/.test(normalizePhoneNumber(value));
}

export function formatPhoneNumber(value: string | null): string {
  if (!value) return "";
  const digits = normalizePhoneNumber(value);
  if (!isValidPhoneNumber(digits)) return value;
  return `(${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6)}`;
}
