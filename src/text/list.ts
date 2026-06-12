/**
 * Arabic list formatting — join items into a grammatical Arabic list
 * ("أحمد ومحمد وعلي", "تفاح أو موز أو برتقال").
 *
 * Wraps `Intl.ListFormat` where available and degrades to a hand-rolled join
 * (using the Arabic conjunction و / disjunction أو) on runtimes without it.
 */

import { DEFAULT_LOCALE } from "../locale";
import type { NumeralSystem } from "../types";
import { toArabicDigits } from "../number/numerals";

export interface FormatListOptions {
  /** BCP-47 locale. Default `"ar"`. */
  locale?: string;
  /**
   * - `"conjunction"` — "و" (and). *(default)*
   * - `"disjunction"` — "أو" (or).
   * - `"unit"` — list of measurements, no conjunction.
   */
  type?: "conjunction" | "disjunction" | "unit";
  /** Width of the connector. Default `"long"`. */
  style?: "long" | "short" | "narrow";
  /** Shape any digits in the result. Default leaves them as-is. */
  numerals?: NumeralSystem;
}

type IntlListFormat = {
  new (
    locale: string,
    options: { type: string; style: string },
  ): { format(items: string[]): string };
};

function fallback(items: string[], type: string): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0] ?? "";
  if (type === "disjunction") return items.join(" أو ");
  return items.join(" و"); // conjunction / unit — و attaches to the next word
}

/**
 * Format an iterable of values as an Arabic list.
 *
 * @example formatList(["أحمد", "محمد", "علي"])               // "أحمد ومحمد وعلي"
 * @example formatList(["تفاح", "موز"], { type: "disjunction" }) // "تفاح أو موز"
 * @example formatList([1, 2, 3], { numerals: "arab" })       // "١ و٢ و٣"
 */
export function formatList(
  items: Iterable<string | number>,
  options: FormatListOptions = {},
): string {
  const arr = Array.from(items, (x) => String(x));
  const locale = options.locale ?? DEFAULT_LOCALE;
  const type = options.type ?? "conjunction";
  const style = options.style ?? "long";

  let out: string;
  const LF = (Intl as unknown as { ListFormat?: IntlListFormat }).ListFormat;
  if (LF) {
    try {
      out = new LF(locale, { type, style }).format(arr);
    } catch {
      out = fallback(arr, type);
    }
  } else {
    out = fallback(arr, type);
  }

  return options.numerals === "arab" ? toArabicDigits(out) : out;
}
