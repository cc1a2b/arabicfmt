import { DEFAULT_LOCALE } from "../locale";
import type { NumeralSystem } from "../types";
import { toArabicDigits } from "./numerals";

export interface FormatRelativeTimeOptions {
  /** BCP-47 locale. Default `"ar"`. */
  locale?: string;
  /** Digit shaping. Default `"latn"`. */
  numerals?: NumeralSystem;
  /**
   * - `"auto"` — uses "yesterday" / "tomorrow" style when available.
   * - `"always"` — always numeric: "1 يوم مضى".
   * Default `"auto"`.
   */
  numeric?: "auto" | "always";
  /** Width of the unit name. Default `"long"`. */
  style?: "long" | "short" | "narrow";
}

const UNITS: Intl.RelativeTimeFormatUnit[] = [
  "year",
  "month",
  "week",
  "day",
  "hour",
  "minute",
  "second",
];

const THRESHOLDS: Record<string, number> = {
  year: 365 * 24 * 3600,
  month: 30 * 24 * 3600,
  week: 7 * 24 * 3600,
  day: 24 * 3600,
  hour: 3600,
  minute: 60,
  second: 1,
};

/**
 * Format the time difference between `date` and `base` as a human-readable
 * relative string ("منذ ٣ أيام", "بعد ساعة", "3 days ago").
 *
 * Picks the most appropriate unit automatically. Works on all engines via
 * `Intl.RelativeTimeFormat`.
 *
 * @example formatRelativeTime(new Date(Date.now() - 3 * 86400_000))
 * // "منذ ٣ أيام"  (locale "ar", numerals "latn" → "منذ 3 أيام")
 * @example formatRelativeTime(new Date(Date.now() + 3600_000), new Date(), { locale: "en" })
 * // "in 1 hour"
 */
export function formatRelativeTime(
  date: Date,
  base: Date = new Date(),
  options: FormatRelativeTimeOptions = {},
): string {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const numeric = options.numeric ?? "auto";
  const style = options.style ?? "long";

  const diffSeconds = (date.getTime() - base.getTime()) / 1000;
  const absDiff = Math.abs(diffSeconds);

  let unit: Intl.RelativeTimeFormatUnit = "second";
  let value = Math.round(diffSeconds);

  for (const u of UNITS) {
    const threshold = THRESHOLDS[u] ?? 1;
    if (absDiff >= threshold) {
      unit = u;
      value = Math.round(diffSeconds / threshold);
      break;
    }
  }

  const formatted = new Intl.RelativeTimeFormat(locale, {
    numeric,
    style,
  }).format(value, unit);

  if (options.numerals === "arab") {
    return toArabicDigits(formatted);
  }
  return formatted;
}
