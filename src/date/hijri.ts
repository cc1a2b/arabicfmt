import { dateToJDN, jdnToDate } from "./jdn";
import type { HijriDate } from "./types";

/**
 * The tabular ("civil", Friday-epoch) Islamic calendar — a pure arithmetic
 * calendar with a fixed 30-year leap cycle. It needs no tables, which keeps the
 * core tiny, and stays within a day or two of the observed Umm al-Qura calendar.
 * For exact official dates, use the `arabicfmt/umalqura` sub-import.
 */
const ISLAMIC_EPOCH = 1948440; // JDN of 1 Muharram 1 AH (civil reckoning)

/** Tabular Hijri Y/M/D → integer JDN. */
export function tabularToJDN(year: number, month: number, day: number): number {
  return (
    day +
    Math.ceil(29.5 * (month - 1)) +
    (year - 1) * 354 +
    Math.floor((3 + 11 * year) / 30) +
    ISLAMIC_EPOCH -
    1
  );
}

/** Integer JDN → tabular Hijri date. */
export function tabularFromJDN(jdn: number): HijriDate {
  let year = Math.floor((30 * (jdn - ISLAMIC_EPOCH) + 10646) / 10631);
  // Correct rounding at year boundaries using the forward formula as truth.
  while (tabularToJDN(year, 1, 1) > jdn) year--;
  while (tabularToJDN(year + 1, 1, 1) <= jdn) year++;

  let month = 1;
  while (month < 12 && tabularToJDN(year, month + 1, 1) <= jdn) month++;

  const day = jdn - tabularToJDN(year, month, 1) + 1;
  return { year, month, day };
}

/** Convert a Gregorian `Date` to a tabular Hijri date. */
export function toHijri(date: Date): HijriDate {
  return tabularFromJDN(dateToJDN(date));
}

/** Convert a tabular Hijri date to a Gregorian `Date` (UTC midnight). */
export function fromHijri(year: number, month: number, day: number): Date {
  return jdnToDate(tabularToJDN(year, month, day));
}
