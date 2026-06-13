import { isolate, stripBidi } from "../bidi/isolate";
import { DEFAULT_LOCALE, withNumberingSystem } from "../locale";
import type { NumeralSystem } from "../types";
import { currencyDigits, currencyForLocale } from "./data";
import { getSymbolData } from "./symbols";

/**
 * How to render the currency symbol:
 * - `auto`  — the safe default: a text symbol that renders in every font today.
 * - `new`   — the dedicated Unicode sign (e.g. U+20C1 for SAR). Needs font support.
 * - `text`  — always the Arabic text symbol (e.g. "ر.س").
 * - `code`  — the ISO 4217 code (e.g. "SAR").
 */
export type SymbolMode = "auto" | "new" | "text" | "code";

/** Where the symbol sits relative to the amount (before bidi resolution). */
export type SymbolPosition = "before" | "after";

const NBSP = " ";

export interface ResolveSymbolOptions {
  mode?: SymbolMode;
  /** Locale used only to look up a fallback symbol for non-Arab currencies. */
  locale?: string;
}

/**
 * Resolve the display symbol for a currency under a given {@link SymbolMode}.
 * Falls back to `Intl`'s symbol for currencies outside the curated Arab set, and
 * to the ISO code when nothing else is available.
 */
export function resolveCurrencySymbol(
  code: string,
  options: ResolveSymbolOptions = {},
): string {
  const mode = options.mode ?? "auto";
  const upper = code.toUpperCase();
  if (mode === "code") return upper;

  const data = getSymbolData(upper);
  if (data) {
    if (mode === "text") return data.text;
    if (mode === "new") return data.unicode?.char ?? data.text;
    // auto
    if (data.unicode?.autoDefault) return data.unicode.char;
    return data.text;
  }

  // Not a curated Arab currency — defer to Intl, else the ISO code.
  return intlSymbol(upper, options.locale ?? DEFAULT_LOCALE) ?? upper;
}

export interface FormatCurrencyOptions {
  /** ISO 4217 code. If omitted, derived from the locale's region. */
  currency?: string;
  /** BCP-47 locale. Default `"ar"`. */
  locale?: string;
  /** Symbol rendering strategy. Default `"auto"`. */
  symbolMode?: SymbolMode;
  /** Digit shaping. Default `"latn"` (Eastern Arabic numerals are opt-in). */
  numerals?: NumeralSystem;
  /** Force a fixed number of fraction digits (sets both min and max). */
  fractionDigits?: number;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  /** Thousands grouping. Default `true`. */
  grouping?: boolean;
  /** Include the symbol. Default `true`. */
  showSymbol?: boolean;
  /** Override symbol placement. Default: locale-appropriate (via Intl). */
  symbolPosition?: SymbolPosition;
  /** Separator between amount and symbol. Default non-breaking space. */
  symbolSpacing?: string;
  /** Wrap the result in a directional isolate for safe embedding. Default false. */
  isolate?: boolean;
  /**
   * Accounting notation: wrap negative values in parentheses instead of
   * using a minus sign. E.g. `(1,234.50 ر.س)`. Default `false`.
   */
  accounting?: boolean;
  /**
   * Sign display. Default `"auto"` (negative sign only).
   * `"always"` always shows `+` / `−`.
   */
  signDisplay?: "auto" | "always" | "exceptZero" | "never";
}

/**
 * Format a monetary amount with the correct symbol and minor-unit precision for
 * its currency.
 *
 * @example formatCurrency(1234.5, { currency: "SAR" })          // "1,234.50 ر.س"
 * @example formatCurrency(1.2, { currency: "KWD" })             // "1.200 د.ك"  (3 decimals)
 * @example formatCurrency(1234.5, { locale: "ar-SA", numerals: "arab" }) // Eastern digits
 */
export function formatCurrency(
  amount: number,
  options: FormatCurrencyOptions = {},
): string {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const currency = (options.currency ?? currencyForLocale(locale))?.toUpperCase();
  if (!currency) {
    throw new Error(
      'arabicfmt: could not resolve a currency. Pass { currency: "SAR" } or a locale with a region, e.g. "ar-SA".',
    );
  }

  const numerals: NumeralSystem = options.numerals ?? "latn";
  const digits = options.fractionDigits ?? currencyDigits(currency);
  const min = options.minimumFractionDigits ?? digits;
  const max = Math.max(min, options.maximumFractionDigits ?? digits);

  const accounting = options.accounting ?? false;
  const absAmount = accounting ? Math.abs(amount) : amount;

  const fmtOpts: Intl.NumberFormatOptions = {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
    useGrouping: options.grouping ?? true,
  };
  if (!accounting && options.signDisplay) fmtOpts.signDisplay = options.signDisplay;

  const numberPart = new Intl.NumberFormat(
    withNumberingSystem(locale, numerals),
    fmtOpts,
  ).format(absAmount);

  if (options.showSymbol === false) {
    return options.isolate ? isolate(numberPart) : numberPart;
  }

  const symbol = resolveCurrencySymbol(currency, {
    mode: options.symbolMode ?? "auto",
    locale,
  });
  const placement = resolvePlacement(locale, currency);
  const spacing = options.symbolSpacing ?? placement.spacing;
  const position = options.symbolPosition ?? placement.position;
  let out =
    position === "before"
      ? `${symbol}${spacing}${numberPart}`
      : `${numberPart}${spacing}${symbol}`;

  if (accounting && amount < 0) out = `(${out})`;

  return options.isolate ? isolate(out) : out;
}

export interface CurrencyInfo {
  /** ISO 4217 code. */
  code: string;
  /** Minor-unit (decimal) digits. */
  digits: number;
  /** The symbol under each mode. `new` is present only when one exists. */
  symbols: { auto: string; text: string; code: string; new?: string };
  /** Unicode transition metadata, when the currency has a dedicated sign. */
  unicode?: {
    codepoint: string;
    unicodeVersion: string;
    released: string;
    live: boolean;
    autoDefault: boolean;
  };
  /** Localized currency display name via Intl, when available. */
  displayName?: string;
}

/** Everything arabicfmt knows about a currency, for a given display locale. */
export function getCurrencyInfo(
  code: string,
  locale: string = DEFAULT_LOCALE,
): CurrencyInfo {
  const upper = code.toUpperCase();
  const data = getSymbolData(upper);

  const info: CurrencyInfo = {
    code: upper,
    digits: currencyDigits(upper),
    symbols: {
      auto: resolveCurrencySymbol(upper, { mode: "auto", locale }),
      text: resolveCurrencySymbol(upper, { mode: "text", locale }),
      code: upper,
    },
  };
  if (data?.unicode) {
    info.symbols.new = data.unicode.char;
    info.unicode = {
      codepoint: data.unicode.codepoint,
      unicodeVersion: data.unicode.unicodeVersion,
      released: data.unicode.released,
      live: data.unicode.live,
      autoDefault: data.unicode.autoDefault,
    };
  }
  const name = intlDisplayName(upper, locale);
  if (name) info.displayName = name;
  return info;
}

// --- internals ---------------------------------------------------------------

function intlSymbol(code: string, locale: string): string | undefined {
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency: code,
      currencyDisplay: "narrowSymbol",
    }).formatToParts(0);
    const sym = parts.find((p) => p.type === "currency")?.value;
    return sym && sym !== code ? sym : undefined;
  } catch {
    return undefined;
  }
}

function intlDisplayName(code: string, locale: string): string | undefined {
  const DisplayNames = (
    Intl as unknown as {
      DisplayNames?: new (
        l: string[],
        o: object,
      ) => { of(c: string): string | undefined };
    }
  ).DisplayNames;
  if (!DisplayNames) return undefined;
  try {
    return new DisplayNames([locale], { type: "currency" }).of(code);
  } catch {
    return undefined;
  }
}

interface Placement {
  position: SymbolPosition;
  spacing: string;
}

const placementCache = new Map<string, Placement>();

/**
 * Decide where the symbol goes and what separates it from the amount, by
 * probing Intl's own currency pattern for the locale (so we match "$1,234.50"
 * but "1,234.50 ر.س"). Falls back to an Arabic-aware heuristic.
 */
function resolvePlacement(locale: string, currency: string): Placement {
  const key = `${locale}|${currency}`;
  const cached = placementCache.get(key);
  if (cached) return cached;

  let placement: Placement = {
    position: locale.toLowerCase().startsWith("ar") ? "after" : "before",
    spacing: NBSP,
  };
  try {
    const parts = new Intl.NumberFormat(locale, {
      style: "currency",
      currency,
    }).formatToParts(1);
    const curIdx = parts.findIndex((p) => p.type === "currency");
    const numIdx = parts.findIndex(
      (p) => p.type === "integer" || p.type === "decimal",
    );
    if (curIdx !== -1 && numIdx !== -1) {
      const position: SymbolPosition = curIdx < numIdx ? "before" : "after";
      // The separator is the literal directly adjacent to the currency symbol.
      const adjacent = position === "before" ? parts[curIdx + 1] : parts[curIdx - 1];
      const hasGap =
        adjacent?.type === "literal" && /\s/.test(stripBidi(adjacent.value));
      placement = { position, spacing: hasGap ? NBSP : "" };
    }
  } catch {
    /* keep heuristic */
  }
  placementCache.set(key, placement);
  return placement;
}
