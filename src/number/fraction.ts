/**
 * Common Arabic fraction words (الكسور): نصف، ثلث، ربع …
 *
 * Denominators 2–10 have dedicated nouns. The numerator follows the usual
 * counted-noun pattern: 1 → singular (ربع), 2 → dual (ربعان), 3–10 → number +
 * plural (ثلاثة أرباع).
 */

import { arabicToWords } from "./words";

interface FractionForms {
  /** 1/n — نصف، ثلث، ربع. */
  singular: string;
  /** 2/n — نصفان، ثلثان، ربعان. */
  dual: string;
  /** 3/n–10/n plural — أنصاف، أثلاث، أرباع. */
  plural: string;
}

// Indexed by denominator (2–10).
const DENOMINATORS: Record<number, FractionForms> = {
  2: { singular: "نصف", dual: "نصفان", plural: "أنصاف" },
  3: { singular: "ثلث", dual: "ثلثان", plural: "أثلاث" },
  4: { singular: "ربع", dual: "ربعان", plural: "أرباع" },
  5: { singular: "خمس", dual: "خمسان", plural: "أخماس" },
  6: { singular: "سدس", dual: "سدسان", plural: "أسداس" },
  7: { singular: "سبع", dual: "سبعان", plural: "أسباع" },
  8: { singular: "ثمن", dual: "ثمنان", plural: "أثمان" },
  9: { singular: "تسع", dual: "تسعان", plural: "أتساع" },
  10: { singular: "عشر", dual: "عشران", plural: "أعشار" },
};

/**
 * Spell a simple fraction in Arabic words.
 *
 * Supports denominators 2–10 (the fractions with dedicated nouns). Returns an
 * empty string for unsupported denominators or non-positive numerators.
 *
 * @example arabicFraction(1, 2) // "نصف"
 * @example arabicFraction(1, 4) // "ربع"
 * @example arabicFraction(3, 4) // "ثلاثة أرباع"
 * @example arabicFraction(2, 3) // "ثلثان"
 * @example arabicFraction(5, 8) // "خمسة أثمان"
 */
export function arabicFraction(numerator: number, denominator: number): string {
  const num = Math.trunc(numerator);
  const forms = DENOMINATORS[Math.trunc(denominator)];
  if (!forms || num < 1) return "";

  if (num === 1) return forms.singular;
  if (num === 2) return forms.dual;
  // 3 and up: number (masculine) + plural noun.
  return `${arabicToWords(num, { gender: "male" })} ${forms.plural}`;
}
