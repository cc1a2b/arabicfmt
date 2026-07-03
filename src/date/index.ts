import { formatHijriDate, type FormatHijriOptions } from "./format";
import { toHijri } from "./hijri";

export { toHijri, fromHijri } from "./hijri";
export {
  dateToJDN,
  gregorianToJDN,
  jdnToDate,
  jdnToGregorian,
} from "./jdn";
export {
  formatHijriDate,
  HIJRI_ERA_AR,
  HIJRI_ERA_EN,
  HIJRI_MONTHS_AR,
  HIJRI_MONTHS_EN,
  GREGORIAN_MONTHS_AR,
  GREGORIAN_MONTHS_EN,
  ARABIC_WEEKDAYS_AR,
  ARABIC_WEEKDAYS_EN,
} from "./format";
export type { FormatHijriOptions } from "./format";
export type { HijriDate } from "./types";

/**
 * Convert a Gregorian `Date` to a Hijri string in one call, using the tabular
 * calendar. For official Umm al-Qura dates use `formatHijri` from
 * `arabicfmt/umalqura`.
 *
 * @example formatHijri(new Date("2025-09-23"), { numerals: "arab" })
 */
export function formatHijri(date: Date, options?: FormatHijriOptions): string {
  return formatHijriDate(toHijri(date), options);
}
