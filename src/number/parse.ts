import { stripBidi } from "../bidi/isolate";
import { toLatinDigits } from "./numerals";

const cc = String.fromCharCode;
// U+066C = Arabic thousands separator ٬, U+066B = Arabic decimal separator ٫
const ARABIC_THOUSANDS = cc(0x066c);
const ARABIC_DECIMAL = cc(0x066b);

/**
 * Parse a localized number string — including Eastern Arabic digits, Arabic
 * thousands separators (٬) and Arabic decimal separator (٫) — back to a JS
 * `number`. Returns `NaN` when the input cannot be parsed.
 *
 * @example parseNumber("١٬٢٣٤٫٥٦")  // 1234.56
 * @example parseNumber("1,234.56")   // 1234.56
 * @example parseNumber("٢٠٢٦")       // 2026
 */
export function parseNumber(input: string): number {
  const clean = toLatinDigits(stripBidi(input))
    .replace(new RegExp(`[,${ARABIC_THOUSANDS}]`, "g"), "") // strip thousands separators
    .replace(new RegExp(`[${ARABIC_DECIMAL}]`, "g"), ".") // normalize decimal point
    .trim();
  return parseFloat(clean);
}

/**
 * Parse a formatted currency string back to its numeric value. Strips known
 * Arab currency symbols, ISO codes, bidi controls and whitespace before
 * delegating to {@link parseNumber}.
 *
 * @example parseCurrency("1,234.50 ر.س")    // 1234.5
 * @example parseCurrency("١٬٢٣٤٫٥٠٠ د.ك")   // 1234.5
 * @example parseCurrency("(500.00 SAR)")     // -500  (accounting notation)
 */
export function parseCurrency(input: string): number {
  const isNegative = /^\(.*\)$/.test(input.trim());
  // 1. Strip parentheses (accounting format)
  // 2. Convert Eastern Arabic digits to Latin first (before any stripping)
  // 3. Normalize separators
  // 4. Strip everything that isn't a digit, decimal point, or sign
  const normalized = toLatinDigits(stripBidi(input))
    .replace(/^\(|\)$/g, "")
    .replace(new RegExp(`[,${ARABIC_THOUSANDS}]`, "g"), "")
    .replace(new RegExp(`[${ARABIC_DECIMAL}]`, "g"), ".")
    .replace(/[^\d.+\-]/g, " ") // keep only digits, decimal and signs
    .trim();

  const value = parseFloat(normalized);
  return isNegative ? -value : value;
}
