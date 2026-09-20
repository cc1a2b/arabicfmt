import type { NumeralSystem } from "../types";

// Built from codepoints so the source stays unambiguous.
const cc = String.fromCharCode;

/** Arabic-Indic digits ٠١٢٣٤٥٦٧٨٩ (U+0660–U+0669), used across the Arab world. */
export const ARABIC_INDIC_DIGITS: readonly string[] = Array.from(
  { length: 10 },
  (_, i) => cc(0x0660 + i),
);

/** Extended Arabic-Indic digits ۰۱۲۳۴۵۶۷۸۹ (U+06F0–U+06F9), used in Persian/Urdu. */
export const EXTENDED_ARABIC_INDIC_DIGITS: readonly string[] = Array.from(
  { length: 10 },
  (_, i) => cc(0x06f0 + i),
);

/** Convert Western digits (0-9) in `input` to Eastern Arabic-Indic digits. */
export function toArabicDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => ARABIC_INDIC_DIGITS[Number(d)]!);
}

/**
 * Convert Western digits (0-9) in `input` to Extended Arabic-Indic digits
 * (۰-۹, U+06F0–U+06F9) — the forms used in Persian and Urdu typography.
 */
export function toExtendedArabicDigits(input: string): string {
  return input.replace(/[0-9]/g, (d) => EXTENDED_ARABIC_INDIC_DIGITS[Number(d)]!);
}

/**
 * Shape the digits already present in `input` for `numerals`. Used by the
 * formatters that build their output as text rather than through `Intl`
 * (Hijri dates, relative time, lists), so every module shapes digits the
 * same way.
 */
export function shapeDigits(input: string, numerals: NumeralSystem): string {
  if (numerals === "arab") return toArabicDigits(input);
  if (numerals === "arabext") return toExtendedArabicDigits(input);
  return input;
}

const EASTERN_DIGITS = new RegExp(
  `[${cc(0x0660)}-${cc(0x0669)}${cc(0x06f0)}-${cc(0x06f9)}]`,
  "g",
);

/**
 * Convert Eastern Arabic-Indic and Extended (Persian) digits in `input` back to
 * Western digits (0-9). Useful before parsing user-entered numbers.
 */
export function toLatinDigits(input: string): string {
  return input.replace(EASTERN_DIGITS, (ch) => {
    const code = ch.charCodeAt(0);
    const base = code >= 0x06f0 ? 0x06f0 : 0x0660;
    return String(code - base);
  });
}
