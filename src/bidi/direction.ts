import type { Direction } from "../types";

// A character is a *strong* direction signal only if it is a letter. Digits,
// punctuation and spaces are neutral for the first-strong heuristic (matching
// the spirit of UAX #9 rule P2, which scans for L / R / AL and skips numbers).
const LETTER = /\p{L}/u;
const RTL_LETTER =
  /[\p{Script=Arabic}\p{Script=Hebrew}\p{Script=Syriac}\p{Script=Thaana}\p{Script=Nko}\p{Script=Samaritan}\p{Script=Mandaic}\p{Script=Adlam}\p{Script=Hanifi_Rohingya}]/u;

/** Strong direction of a single character/codepoint. */
export function charDirection(ch: string): Direction {
  if (!LETTER.test(ch)) return "neutral";
  return RTL_LETTER.test(ch) ? "rtl" : "ltr";
}

/**
 * Detect the base direction of `text` using the first-strong-character rule.
 * Returns `"neutral"` when the string has no strong letters (e.g. only digits
 * or punctuation).
 */
export function detectDirection(text: string): Direction {
  for (const ch of text) {
    const dir = charDirection(ch);
    if (dir !== "neutral") return dir;
  }
  return "neutral";
}

/** True when the first strong character of `text` is right-to-left. */
export function isRTL(text: string): boolean {
  return detectDirection(text) === "rtl";
}
