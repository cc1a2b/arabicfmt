import { DEFAULT_LOCALE, withNumberingSystem } from "../locale";
import type { NumeralSystem } from "../types";

export interface FormatNumberOptions {
  /** BCP-47 locale. Default `"ar"`. */
  locale?: string;
  /** Digit shaping. Default `"latn"` — Eastern Arabic digits are opt-in. */
  numerals?: NumeralSystem;
  /** Fixed number of fraction digits (sets both min and max). */
  fractionDigits?: number;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /** Thousands grouping. Default `true`. */
  grouping?: boolean;
  /** Number style. Default `"decimal"`. */
  style?: "decimal" | "percent";
  signDisplay?: "auto" | "always" | "exceptZero" | "never";
  /** Compact / scientific notation. Default `"standard"`. */
  notation?: "standard" | "compact" | "scientific" | "engineering";
  /** Compact display style when `notation` is `"compact"`. Default `"short"`. */
  compactDisplay?: "short" | "long";
}

/**
 * Locale-aware number formatting on top of `Intl.NumberFormat`. Eastern Arabic
 * numerals are never forced — pass `numerals: "arab"` to opt in.
 *
 * @example formatNumber(1234567.89)                         // "1,234,567.89"
 * @example formatNumber(1234.5, { numerals: "arab" })       // "١٬٢٣٤٫٥"
 * @example formatNumber(0.42, { style: "percent" })         // "42%"
 */
export function formatNumber(
  value: number,
  options: FormatNumberOptions = {},
): string {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const numerals = options.numerals ?? "latn";

  const intlOptions: Intl.NumberFormatOptions = {
    style: options.style ?? "decimal",
    useGrouping: options.grouping ?? true,
  };
  if (options.fractionDigits != null) {
    intlOptions.minimumFractionDigits = options.fractionDigits;
    intlOptions.maximumFractionDigits = options.fractionDigits;
  }
  if (options.minimumFractionDigits != null) {
    intlOptions.minimumFractionDigits = options.minimumFractionDigits;
  }
  if (options.maximumFractionDigits != null) {
    intlOptions.maximumFractionDigits = options.maximumFractionDigits;
  }
  if (options.signDisplay) intlOptions.signDisplay = options.signDisplay;
  if (options.notation) {
    (intlOptions as Record<string, unknown>).notation = options.notation;
    if (options.notation === "compact") {
      (intlOptions as Record<string, unknown>).compactDisplay =
        options.compactDisplay ?? "short";
    }
  }

  return new Intl.NumberFormat(
    withNumberingSystem(locale, numerals),
    intlOptions,
  ).format(value);
}

/** Format a ratio (0.42 → "42%") with the same options as {@link formatNumber}. */
export function formatPercent(
  value: number,
  options: Omit<FormatNumberOptions, "style"> = {},
): string {
  return formatNumber(value, { ...options, style: "percent" });
}

/**
 * Format a number in compact notation ("short" by default): 1,200,000 → "1.2M"
 * or in Arabic "١٫٢ مليون" (when `numerals: "arab"` and an Arabic locale).
 *
 * @example formatCompact(1_200_000)                       // "1.2M"
 * @example formatCompact(1_200_000, { locale: "ar" })     // "1.2 مليون"
 * @example formatCompact(1_200_000, { numerals: "arab" }) // "١٫٢ مليون"
 */
export function formatCompact(
  value: number,
  options: Omit<FormatNumberOptions, "notation" | "compactDisplay"> & {
    compactDisplay?: "short" | "long";
  } = {},
): string {
  return formatNumber(value, {
    ...options,
    notation: "compact",
    compactDisplay: options.compactDisplay ?? "short",
  });
}
