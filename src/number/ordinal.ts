/**
 * Arabic ordinal numbers (الأعداد الترتيبية).
 *
 * Ordinals 1–19 have dedicated forms; 20–99 combine a unit ordinal with a tens
 * word ("الخامس والعشرون"). Each form agrees in gender with the noun it
 * describes. Values ≥ 100 fall back to a definite cardinal ("ال" + words),
 * which is the form used in everyday writing (الصفحة المئة وخمسة وعشرون).
 */

import { arabicToWords } from "./words";

type Gender = "male" | "female";

// Index = value (1–19); index 0 unused.
const ORD_M = [
  "",
  "الأول",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
  "العاشر",
  "الحادي عشر",
  "الثاني عشر",
  "الثالث عشر",
  "الرابع عشر",
  "الخامس عشر",
  "السادس عشر",
  "السابع عشر",
  "الثامن عشر",
  "التاسع عشر",
] as const;

const ORD_F = [
  "",
  "الأولى",
  "الثانية",
  "الثالثة",
  "الرابعة",
  "الخامسة",
  "السادسة",
  "السابعة",
  "الثامنة",
  "التاسعة",
  "العاشرة",
  "الحادية عشرة",
  "الثانية عشرة",
  "الثالثة عشرة",
  "الرابعة عشرة",
  "الخامسة عشرة",
  "السادسة عشرة",
  "السابعة عشرة",
  "الثامنة عشرة",
  "التاسعة عشرة",
] as const;

// Unit ordinal used inside compounds 21–99 (index = unit digit 1–9).
const COMPOUND_M = [
  "",
  "الحادي",
  "الثاني",
  "الثالث",
  "الرابع",
  "الخامس",
  "السادس",
  "السابع",
  "الثامن",
  "التاسع",
] as const;

const COMPOUND_F = [
  "",
  "الحادية",
  "الثانية",
  "الثالثة",
  "الرابعة",
  "الخامسة",
  "السادسة",
  "السابعة",
  "الثامنة",
  "التاسعة",
] as const;

// Tens ordinals (index = tens digit 2–9); identical for both genders.
const TENS_ORD = [
  "",
  "",
  "العشرون",
  "الثلاثون",
  "الأربعون",
  "الخمسون",
  "الستون",
  "السبعون",
  "الثمانون",
  "التسعون",
] as const;

/** Strip the definite article ال at each word boundary (start or after و). */
function indefinite(s: string): string {
  return s.replace(/(^|و)ال/g, "$1");
}

export interface ArabicOrdinalOptions {
  /** Gender of the described noun. Default `"male"`. */
  gender?: Gender;
  /** Include the definite article ال. Default `true`. */
  definite?: boolean;
}

/**
 * Return the Arabic ordinal word for a positive integer.
 *
 * @example arabicOrdinal(1)  // "الأول"
 * @example arabicOrdinal(2)  // "الثاني"
 * @example arabicOrdinal(11) // "الحادي عشر"
 * @example arabicOrdinal(25) // "الخامس والعشرون"
 * @example arabicOrdinal(1, { gender: "female" }) // "الأولى"
 * @example arabicOrdinal(3, { definite: false })  // "ثالث"
 * @example arabicOrdinal(100) // "المئة"
 */
export function arabicOrdinal(
  n: number,
  options: ArabicOrdinalOptions = {},
): string {
  if (!Number.isFinite(n)) return "";

  const gender: Gender = options.gender ?? "male";
  const definite = options.definite ?? true;
  const value = Math.trunc(n);
  if (value < 1) return "";

  let base: string;

  if (value <= 19) {
    base = (gender === "male" ? ORD_M : ORD_F)[value] ?? "";
  } else if (value <= 99) {
    const tens = Math.floor(value / 10);
    const unit = value % 10;
    const tensWord = TENS_ORD[tens] ?? "";
    if (unit === 0) {
      base = tensWord;
    } else {
      const unitWord =
        (gender === "male" ? COMPOUND_M : COMPOUND_F)[unit] ?? "";
      base = `${unitWord} و${tensWord}`;
    }
  } else {
    // ≥ 100 — definite cardinal fallback (e.g. "المئة وخمسة وعشرون").
    base = `ال${arabicToWords(value, { gender })}`;
  }

  return definite ? base : indefinite(base);
}
