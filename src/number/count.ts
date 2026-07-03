/**
 * Counted-noun agreement (العدد والمعدود) — the rule that decides whether a
 * noun appears as singular, dual, plural or accusative-singular after a number.
 *
 * This is the shared engine behind both the currency speller (التفقيط) and the
 * duration formatter: give it a count and the four inflected forms of a noun,
 * and it returns the number-in-words followed by the correctly-inflected noun.
 */

import { arabicToWords } from "./words";

/** The four inflected forms a noun needs to agree with any Arabic number. */
export interface CountedNoun {
  /** Grammatical gender — drives number agreement (3–9 use gender polarity). */
  gender: "male" | "female";
  /** Singular (مفرد): ريال / ساعة. Used for 1 and for hundreds/thousands. */
  singular: string;
  /** Dual (مثنى): ريالان / ساعتان. Used for exactly 2. */
  dual: string;
  /** Plural (جمع): ريالات / ساعات. Used for 3–10. */
  plural: string;
  /** Accusative singular (تمييز منصوب): ريالاً / ساعةً. Used for 11–99. */
  accusative: string;
}

/**
 * Spell `<number-in-words> <correctly-inflected-noun>` for a positive count.
 *
 * @example countedNoun(2, hourForms)   // "ساعتان"
 * @example countedNoun(3, hourForms)   // "ثلاث ساعات"
 * @example countedNoun(11, riyalForms) // "أحد عشر ريالاً"
 * @example countedNoun(100, riyalForms)// "مئة ريال"
 */
export function countedNoun(n: number, noun: CountedNoun): string {
  if (n === 1) {
    return `${noun.singular} ${noun.gender === "female" ? "واحدة" : "واحد"}`;
  }
  if (n === 2) return noun.dual;

  const words = arabicToWords(n, { gender: noun.gender });
  const mod = n % 100;
  let unit: string;
  if (mod >= 3 && mod <= 10) unit = noun.plural;
  else if (mod >= 11 && mod <= 99) unit = noun.accusative;
  else unit = noun.singular; // 0, 1, 2 within hundreds/thousands → genitive singular
  return `${words} ${unit}`;
}
