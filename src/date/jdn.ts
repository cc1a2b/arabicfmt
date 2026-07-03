/**
 * Julian Day Number helpers (proleptic Gregorian, date-only / integer JDN).
 *
 * These are the shared bridge between the Gregorian calendar and both Hijri
 * engines. All conversions are done in UTC so they never depend on the host
 * timezone.
 */

/** Gregorian Y/M/D → integer Julian Day Number (Fliegel–Van Flandern). */
export function gregorianToJDN(
  year: number,
  month: number,
  day: number,
): number {
  const a = Math.floor((14 - month) / 12);
  const y = year + 4800 - a;
  const m = month + 12 * a - 3;
  return (
    day +
    Math.floor((153 * m + 2) / 5) +
    365 * y +
    Math.floor(y / 4) -
    Math.floor(y / 100) +
    Math.floor(y / 400) -
    32045
  );
}

/** Integer Julian Day Number → Gregorian Y/M/D. */
export function jdnToGregorian(jdn: number): {
  year: number;
  month: number;
  day: number;
} {
  const a = jdn + 32044;
  const b = Math.floor((4 * a + 3) / 146097);
  const c = a - Math.floor((146097 * b) / 4);
  const d = Math.floor((4 * c + 3) / 1461);
  const e = c - Math.floor((1461 * d) / 4);
  const m = Math.floor((5 * e + 2) / 153);
  return {
    day: e - Math.floor((153 * m + 2) / 5) + 1,
    month: m + 3 - 12 * Math.floor(m / 10),
    year: 100 * b + d - 4800 + Math.floor(m / 10),
  };
}

/** `Date` → integer JDN, reading the date's UTC fields. */
export function dateToJDN(date: Date): number {
  return gregorianToJDN(
    date.getUTCFullYear(),
    date.getUTCMonth() + 1,
    date.getUTCDate(),
  );
}

/** Integer JDN → `Date` at UTC midnight. */
export function jdnToDate(jdn: number): Date {
  const g = jdnToGregorian(jdn);
  return new Date(Date.UTC(g.year, g.month - 1, g.day));
}
