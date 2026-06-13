import { formatHijriDate, type FormatHijriOptions } from "../date/format";
import { gregorianToUmalqura } from "./convert";

export {
  gregorianToUmalqura,
  isUmalquraYear,
  jdnToUmalqura,
  umalquraToGregorian,
  umalquraToJDN,
  UMALQURA_FIRST_YEAR,
  UMALQURA_LAST_YEAR,
} from "./convert";

// Drop-in aliases mirroring `arabicfmt/date`, but backed by the accurate table.
export { gregorianToUmalqura as toHijri } from "./convert";
export { umalquraToGregorian as fromHijri } from "./convert";

// Re-export formatting so `arabicfmt/umalqura` is self-sufficient.
export {
  formatHijriDate,
  HIJRI_ERA_AR,
  HIJRI_ERA_EN,
  HIJRI_MONTHS_AR,
  HIJRI_MONTHS_EN,
} from "../date/format";
export type { FormatHijriOptions } from "../date/format";
export type { HijriDate } from "../date/types";

/**
 * Convert a Gregorian `Date` to an official Umm al-Qura Hijri string in one
 * call. Deterministic across engines.
 *
 * @example formatHijri(new Date("2025-09-23"), { numerals: "arab" })
 * // "٦ ربيع الآخر ١٤٤٧ هـ"
 */
export function formatHijri(date: Date, options?: FormatHijriOptions): string {
  return formatHijriDate(gregorianToUmalqura(date), options);
}
