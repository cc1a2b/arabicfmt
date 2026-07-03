/**
 * Format a byte count as a human-readable data size with Arabic (or Latin)
 * unit names: 1536 → "1.5 كيلوبايت".
 */

import { DEFAULT_LOCALE } from "../locale";
import type { NumeralSystem } from "../types";
import { formatNumber } from "./format";

const UNITS_AR = [
  "بايت",
  "كيلوبايت",
  "ميجابايت",
  "جيجابايت",
  "تيرابايت",
  "بيتابايت",
  "إكسابايت",
] as const;

const UNITS_LATIN = ["B", "KB", "MB", "GB", "TB", "PB", "EB"] as const;

export interface FormatFileSizeOptions {
  /** BCP-47 locale for the number. Default `"ar"`. */
  locale?: string;
  /** Digit shaping. Default `"latn"`. */
  numerals?: NumeralSystem;
  /** Divisor: `1024` (binary, default) or `1000` (decimal/SI). */
  base?: 1024 | 1000;
  /** Maximum fraction digits for the scaled value. Default `1`. */
  precision?: number;
  /** Unit vocabulary. `"arabic"` (default) or `"latin"` (B/KB/MB…). */
  unitStyle?: "arabic" | "latin";
}

/**
 * Format a byte count with Arabic data-size units.
 *
 * @example formatFileSize(0)                          // "0 بايت"
 * @example formatFileSize(1536)                       // "1.5 كيلوبايت"
 * @example formatFileSize(5_242_880)                  // "5 ميجابايت"
 * @example formatFileSize(1_500_000, { base: 1000 })  // "1.5 ميجابايت"
 * @example formatFileSize(2048, { numerals: "arab" }) // "٢ كيلوبايت"
 * @example formatFileSize(2048, { unitStyle: "latin" })// "2 KB"
 */
export function formatFileSize(
  bytes: number,
  options: FormatFileSizeOptions = {},
): string {
  if (!Number.isFinite(bytes)) return "";

  const locale = options.locale ?? DEFAULT_LOCALE;
  const numerals = options.numerals ?? "latn";
  const base = options.base ?? 1024;
  const precision = options.precision ?? 1;
  const units = options.unitStyle === "latin" ? UNITS_LATIN : UNITS_AR;

  const negative = bytes < 0;
  const abs = Math.abs(bytes);

  // Choose the unit; bytes themselves are always shown as whole numbers.
  let exponent =
    abs < 1 ? 0 : Math.floor(Math.log(abs) / Math.log(base));
  exponent = Math.min(exponent, units.length - 1);

  const value = abs / base ** exponent;
  const maximumFractionDigits = exponent === 0 ? 0 : precision;

  const number = formatNumber(value, {
    locale,
    numerals,
    maximumFractionDigits,
  });

  const unit = units[exponent] ?? units[units.length - 1];
  return `${negative ? "-" : ""}${number} ${unit}`;
}
