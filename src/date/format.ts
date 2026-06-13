import { toArabicDigits } from "../number/numerals";
import type { NumeralSystem } from "../types";
import type { HijriDate } from "./types";

/** Arabic names of the twelve Hijri months (index 0 = Muharram). */
export const HIJRI_MONTHS_AR: readonly string[] = [
  "محرّم",
  "صفر",
  "ربيع الأول",
  "ربيع الآخر",
  "جمادى الأولى",
  "جمادى الآخرة",
  "رجب",
  "شعبان",
  "رمضان",
  "شوّال",
  "ذو القعدة",
  "ذو الحجة",
];

/** Transliterated English names of the twelve Hijri months. */
export const HIJRI_MONTHS_EN: readonly string[] = [
  "Muharram",
  "Safar",
  "Rabi al-Awwal",
  "Rabi al-Thani",
  "Jumada al-Awwal",
  "Jumada al-Thani",
  "Rajab",
  "Shaban",
  "Ramadan",
  "Shawwal",
  "Dhu al-Qadah",
  "Dhu al-Hijjah",
];

/** Era marker: "هـ" in Arabic, "AH" otherwise. */
export const HIJRI_ERA_AR = "هـ";
export const HIJRI_ERA_EN = "AH";

/** Arabic names of the twelve Gregorian months (index 0 = January). */
export const GREGORIAN_MONTHS_AR: readonly string[] = [
  "يناير",
  "فبراير",
  "مارس",
  "أبريل",
  "مايو",
  "يونيو",
  "يوليو",
  "أغسطس",
  "سبتمبر",
  "أكتوبر",
  "نوفمبر",
  "ديسمبر",
];

/** English names of the twelve Gregorian months (index 0 = January). */
export const GREGORIAN_MONTHS_EN: readonly string[] = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Arabic weekday names (index 0 = Sunday, matching `Date.prototype.getDay()`).
 */
export const ARABIC_WEEKDAYS_AR: readonly string[] = [
  "الأحد",
  "الاثنين",
  "الثلاثاء",
  "الأربعاء",
  "الخميس",
  "الجمعة",
  "السبت",
];

/** English weekday names (index 0 = Sunday). */
export const ARABIC_WEEKDAYS_EN: readonly string[] = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

export interface FormatHijriOptions {
  /** Language for month names and era. Default `"ar"`. */
  locale?: string;
  /** Digit shaping. Default `"latn"` — Eastern Arabic digits are opt-in. */
  numerals?: NumeralSystem;
  /** Month rendering. Default `"long"` (named month). */
  month?: "long" | "numeric" | "2-digit";
  /** Day rendering. Default `"numeric"`. */
  day?: "numeric" | "2-digit";
  /** Append the era marker (AH / هـ). Default `true`. */
  era?: boolean;
  /** Field order. Default `"dmy"`. */
  order?: "dmy" | "ymd";
  /** Field separator. Default `" "` for named months, `"/"` otherwise. */
  separator?: string;
}

function shape(value: string, numerals: NumeralSystem): string {
  return numerals === "arab" ? toArabicDigits(value) : value;
}

/**
 * Format a {@link HijriDate} deterministically — same output on Node, browsers
 * and React Native, unlike `Intl`'s Hijri formatting which varies by engine.
 *
 * @example formatHijriDate({ year: 1447, month: 1, day: 1 })
 * // "1 Muharram 1447 AH"  (locale "ar" gives "1 محرّم 1447 هـ")
 */
export function formatHijriDate(
  hijri: HijriDate,
  options: FormatHijriOptions = {},
): string {
  const locale = options.locale ?? "ar";
  const isArabic = locale.toLowerCase().startsWith("ar");
  const numerals = options.numerals ?? "latn";
  const monthStyle = options.month ?? "long";
  const named = monthStyle === "long";

  const dayStr = shape(
    options.day === "2-digit" ? String(hijri.day).padStart(2, "0") : String(hijri.day),
    numerals,
  );

  let monthStr: string;
  if (named) {
    const names = isArabic ? HIJRI_MONTHS_AR : HIJRI_MONTHS_EN;
    monthStr = names[hijri.month - 1] ?? String(hijri.month);
  } else {
    monthStr = shape(
      monthStyle === "2-digit"
        ? String(hijri.month).padStart(2, "0")
        : String(hijri.month),
      numerals,
    );
  }

  const yearStr = shape(String(hijri.year), numerals);
  const separator = options.separator ?? (named ? " " : "/");
  const order = options.order ?? "dmy";
  const fields =
    order === "ymd" ? [yearStr, monthStr, dayStr] : [dayStr, monthStr, yearStr];

  let out = fields.join(separator);
  if (options.era ?? true) {
    out += ` ${isArabic ? HIJRI_ERA_AR : HIJRI_ERA_EN}`;
  }
  return out;
}
