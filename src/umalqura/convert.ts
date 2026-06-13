import { dateToJDN, gregorianToJDN, jdnToDate } from "../date/jdn";
import type { HijriDate } from "../date/types";
import {
  EPOCH_GREGORIAN,
  FIRST_YEAR,
  LAST_YEAR,
  MONTH_LENGTH_BITS,
  TOTAL_DAYS,
} from "./table.generated";

const EPOCH_JDN = gregorianToJDN(
  EPOCH_GREGORIAN[0],
  EPOCH_GREGORIAN[1],
  EPOCH_GREGORIAN[2],
);

/** First Hijri year covered by the bundled Umm al-Qura table. */
export const UMALQURA_FIRST_YEAR = FIRST_YEAR;
/** Last Hijri year covered by the bundled Umm al-Qura table. */
export const UMALQURA_LAST_YEAR = LAST_YEAR;

function yearDays(bits: number): number {
  let days = 0;
  for (let m = 0; m < 12; m++) days += 29 + ((bits >> m) & 1);
  return days;
}

// YEAR_OFFSET[i] = days from the epoch to 1 Muharram of (FIRST_YEAR + i).
// One extra trailing entry acts as a sentinel equal to TOTAL_DAYS.
const YEAR_OFFSET: number[] = (() => {
  const offsets: number[] = [];
  let acc = 0;
  for (let i = 0; i < MONTH_LENGTH_BITS.length; i++) {
    offsets.push(acc);
    acc += yearDays(MONTH_LENGTH_BITS[i]!);
  }
  offsets.push(acc);
  return offsets;
})();

function monthLength(yearIndex: number, month: number): number {
  return 29 + ((MONTH_LENGTH_BITS[yearIndex]! >> (month - 1)) & 1);
}

/** True when `year` is inside the table's authoritative range. */
export function isUmalquraYear(year: number): boolean {
  return year >= FIRST_YEAR && year <= LAST_YEAR;
}

/** Umm al-Qura Y/M/D → integer JDN. Throws outside the supported range. */
export function umalquraToJDN(
  year: number,
  month: number,
  day: number,
): number {
  if (!isUmalquraYear(year)) {
    throw new RangeError(
      `arabicfmt/umalqura: year ${year} is outside the supported range AH ${FIRST_YEAR}–${LAST_YEAR}.`,
    );
  }
  if (month < 1 || month > 12) {
    throw new RangeError(`arabicfmt/umalqura: invalid month ${month}.`);
  }
  const yearIndex = year - FIRST_YEAR;
  let days = YEAR_OFFSET[yearIndex]!;
  for (let m = 1; m < month; m++) days += monthLength(yearIndex, m);
  return EPOCH_JDN + days + (day - 1);
}

/** Integer JDN → Umm al-Qura date. Throws outside the supported range. */
export function jdnToUmalqura(jdn: number): HijriDate {
  const offset = jdn - EPOCH_JDN;
  if (offset < 0 || offset >= TOTAL_DAYS) {
    throw new RangeError(
      `arabicfmt/umalqura: date is outside the supported Umm al-Qura range (AH ${FIRST_YEAR}–${LAST_YEAR}).`,
    );
  }

  // Binary search for the year whose span contains `offset`.
  let lo = 0;
  let hi = MONTH_LENGTH_BITS.length - 1;
  let yearIndex = 0;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (offset < YEAR_OFFSET[mid]!) {
      hi = mid - 1;
    } else if (offset >= YEAR_OFFSET[mid + 1]!) {
      lo = mid + 1;
    } else {
      yearIndex = mid;
      break;
    }
  }

  let remainder = offset - YEAR_OFFSET[yearIndex]!;
  let month = 1;
  while (month < 12) {
    const len = monthLength(yearIndex, month);
    if (remainder < len) break;
    remainder -= len;
    month++;
  }
  return { year: FIRST_YEAR + yearIndex, month, day: remainder + 1 };
}

/** Convert a Gregorian `Date` to an Umm al-Qura date. */
export function gregorianToUmalqura(date: Date): HijriDate {
  return jdnToUmalqura(dateToJDN(date));
}

/** Convert an Umm al-Qura date to a Gregorian `Date` (UTC midnight). */
export function umalquraToGregorian(
  year: number,
  month: number,
  day: number,
): Date {
  return jdnToDate(umalquraToJDN(year, month, day));
}
