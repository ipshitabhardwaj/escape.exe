/**
 * Same rule as the database function escape_norm(): letters and digits only,
 * upper case. "w-a r d e n" and "WARDEN" are the same answer; "37 19" is 3719.
 */
export function normalizeAnswer(raw: string): string {
  return String(raw ?? "")
    .replace(/[^A-Za-z0-9]/g, "")
    .toUpperCase();
}
