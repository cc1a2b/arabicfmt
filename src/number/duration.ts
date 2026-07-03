/**
 * Spell a time span in grammatical Arabic ("ساعتان وخمس دقائق").
 *
 * Unlike `Intl.DurationFormat` (still poorly supported), this produces the fully
 * inflected spoken form: it picks the largest non-zero units, applies dual /
 * plural / accusative agreement to each unit noun, and joins them with و.
 */

import { countedNoun, type CountedNoun } from "./count";

export type DurationUnit = "day" | "hour" | "minute" | "second";

const SECOND: CountedNoun = { gender: "female", singular: "ثانية", dual: "ثانيتان", plural: "ثوانٍ", accusative: "ثانيةً" };
const MINUTE: CountedNoun = { gender: "female", singular: "دقيقة", dual: "دقيقتان", plural: "دقائق", accusative: "دقيقةً" };
const HOUR: CountedNoun = { gender: "female", singular: "ساعة", dual: "ساعتان", plural: "ساعات", accusative: "ساعةً" };
const DAY: CountedNoun = { gender: "male", singular: "يوم", dual: "يومان", plural: "أيام", accusative: "يوماً" };

const UNIT_SECONDS: Record<DurationUnit, number> = {
  day: 86400,
  hour: 3600,
  minute: 60,
  second: 1,
};

const UNIT_NOUN: Record<DurationUnit, CountedNoun> = {
  day: DAY,
  hour: HOUR,
  minute: MINUTE,
  second: SECOND,
};

const ORDER: DurationUnit[] = ["day", "hour", "minute", "second"];

export interface FormatDurationOptions {
  /** Interpret the input as `"ms"` (default) or `"s"`. */
  input?: "ms" | "s";
  /** Maximum number of units to include, largest first. Default `2`. */
  largest?: number;
  /** Restrict the units considered. Default day/hour/minute/second. */
  units?: DurationUnit[];
}

/**
 * Format a duration as spelled Arabic.
 *
 * @example formatDuration(7_500_000)               // "ساعتان وخمس دقائق"
 * @example formatDuration(90, { input: "s" })      // "دقيقة واحدة وثلاثون ثانيةً"
 * @example formatDuration(3_600_000, { largest: 1 })// "ساعة واحدة"
 * @example formatDuration(500)                      // "أقل من ثانية"
 */
export function formatDuration(
  value: number,
  options: FormatDurationOptions = {},
): string {
  if (!Number.isFinite(value)) return "";

  const seconds = Math.floor(
    Math.abs(value) / (options.input === "s" ? 1 : 1000),
  );
  const largest = options.largest ?? 2;
  const allowed = options.units ?? ORDER;
  const units = ORDER.filter((u) => allowed.includes(u));

  if (seconds === 0) return "أقل من ثانية";

  const parts: string[] = [];
  let remaining = seconds;
  for (const unit of units) {
    const size = UNIT_SECONDS[unit];
    const count = Math.floor(remaining / size);
    if (count > 0) {
      parts.push(countedNoun(count, UNIT_NOUN[unit]));
      remaining -= count * size;
    }
    if (parts.length >= largest) break;
  }

  return parts.join(" و");
}
