import { FSI, PDI, stripBidi } from "../bidi/isolate";
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

const NBSP = " ";

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
  return joinParts(formatCurrencyToParts(amount, options));
}

// --- parts -------------------------------------------------------------------

/**
 * Kind of a {@link CurrencyPart}. The number kinds mirror
 * `Intl.NumberFormatPart`; `currency`, `parenthesis`, `isolate` and
 * `rangeSeparator` are the pieces arabicfmt adds around it.
 */
export type CurrencyPartType =
  | "currency"
  | "integer"
  | "group"
  | "decimal"
  | "fraction"
  | "minusSign"
  | "plusSign"
  | "literal"
  | "parenthesis"
  | "isolate"
  | "rangeSeparator";

/** One piece of a formatted amount. Concatenating `value`s rebuilds the string. */
export interface CurrencyPart {
  readonly type: CurrencyPartType;
  readonly value: string;
  /** `currency` parts only: the mode the symbol was resolved under. */
  readonly symbolMode?: SymbolMode;
  /** `currency` parts only: codepoint label when the value is a dedicated sign. */
  readonly codepoint?: string;
  /**
   * `currency` parts only: `true` when the value is a dedicated Unicode sign,
   * which many system fonts still cannot draw — wrap exactly this part in your
   * webfont span and leave the digits alone.
   */
  readonly needsFont?: boolean;
}

/**
 * Format an amount as typed parts instead of a string — the currency
 * counterpart to `Intl.NumberFormat.prototype.formatToParts`.
 *
 * This exists because of the Unicode currency-sign transition: to render
 * U+20C1 you have to wrap *just the sign* in a font-scoped element, and
 * splitting a finished string back apart with a regex is how bidi bugs start.
 * The `currency` part carries its codepoint and whether it needs font coverage.
 *
 * @example
 * formatCurrencyToParts(1234.5, { currency: "SAR", symbolMode: "new" });
 * // [ { type: "integer", value: "1" }, { type: "group", value: "," },
 * //   { type: "integer", value: "234" }, { type: "decimal", value: "." },
 * //   { type: "fraction", value: "50" }, { type: "literal", value: " " },
 * //   { type: "currency", value: "⃁", symbolMode: "new",
 * //     codepoint: "U+20C1", needsFont: true } ]
 *
 * @example
 * // React: font-scope only the sign
 * formatCurrencyToParts(n, { currency: "SAR", symbolMode: "new" }).map((p, i) =>
 *   p.needsFont ? <span key={i} className="riyal">{p.value}</span> : p.value
 * );
 */
export function formatCurrencyToParts(
  amount: number,
  options: FormatCurrencyOptions = {},
): CurrencyPart[] {
  const resolved = resolveFormat(options);
  const negative = resolved.accounting && amount < 0;
  const numeric = numberParts(
    resolved.format,
    resolved.accounting ? Math.abs(amount) : amount,
  );

  let parts = resolved.showSymbol ? attachSymbol(numeric, resolved) : numeric;
  parts = withParentheses(parts, negative);
  return withIsolate(parts, options.isolate === true);
}

export interface FormatCurrencyRangeOptions extends FormatCurrencyOptions {
  /** Text placed between the two amounts. Default `" – "` (spaced en dash). */
  rangeSeparator?: string;
  /** Repeat the symbol on both amounts instead of showing it once. Default `false`. */
  symbolEach?: boolean;
}

/**
 * Format a price range. The symbol is written once by default — the way price
 * ranges are actually set in Arabic catalogues — and both ends share one
 * precision, so a range can never show `1,200.5 – 1,300.00`.
 *
 * @example formatCurrencyRange(1000, 5000, { currency: "SAR" })
 * // "1,000.00 – 5,000.00 ر.س"
 *
 * @example formatCurrencyRange(1000, 5000, { currency: "SAR", symbolEach: true })
 * // "1,000.00 ر.س – 5,000.00 ر.س"
 *
 * @example formatCurrencyRange(50, 50, { currency: "AED" })   // "50.00 ⃃"  (collapses)
 */
export function formatCurrencyRange(
  min: number,
  max: number,
  options: FormatCurrencyRangeOptions = {},
): string {
  if (!Number.isFinite(min) || !Number.isFinite(max)) {
    throw new RangeError(
      "arabicfmt: formatCurrencyRange needs two finite amounts.",
    );
  }
  if (min > max) {
    throw new RangeError(
      `arabicfmt: formatCurrencyRange received a reversed range (${min} > ${max}).`,
    );
  }
  if (min === max) return formatCurrency(min, options);

  const resolved = resolveFormat(options);
  const separator: CurrencyPart = {
    type: "rangeSeparator",
    value: options.rangeSeparator ?? " – ",
  };

  const endpoint = (value: number): CurrencyPart[] => {
    const negative = resolved.accounting && value < 0;
    const numeric = numberParts(
      resolved.format,
      resolved.accounting ? Math.abs(value) : value,
    );
    const symbolised =
      options.symbolEach && resolved.showSymbol
        ? attachSymbol(numeric, resolved)
        : numeric;
    return withParentheses(symbolised, negative);
  };

  const body = [...endpoint(min), separator, ...endpoint(max)];
  const parts =
    resolved.showSymbol && !options.symbolEach
      ? attachSymbol(body, resolved)
      : body;

  return joinParts(withIsolate(parts, options.isolate === true));
}

// --- internals ---------------------------------------------------------------

function joinParts(parts: readonly CurrencyPart[]): string {
  let out = "";
  for (const part of parts) out += part.value;
  return out;
}

interface ResolvedFormat {
  locale: string;
  currency: string;
  format: Intl.NumberFormat;
  accounting: boolean;
  showSymbol: boolean;
  mode: SymbolMode;
  position: SymbolPosition;
  spacing: string;
}

function resolveFormat(options: FormatCurrencyOptions): ResolvedFormat {
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

  const fmtOpts: Intl.NumberFormatOptions = {
    minimumFractionDigits: min,
    maximumFractionDigits: max,
    useGrouping: options.grouping ?? true,
  };
  if (!accounting && options.signDisplay) fmtOpts.signDisplay = options.signDisplay;

  const placement = resolvePlacement(locale, currency);
  return {
    locale,
    currency,
    format: new Intl.NumberFormat(withNumberingSystem(locale, numerals), fmtOpts),
    accounting,
    showSymbol: options.showSymbol !== false,
    mode: options.symbolMode ?? "auto",
    position: options.symbolPosition ?? placement.position,
    spacing: options.symbolSpacing ?? placement.spacing,
  };
}

const NUMBER_PART_TYPES = new Set<string>([
  "integer",
  "group",
  "decimal",
  "fraction",
  "minusSign",
  "plusSign",
]);

/**
 * Split a number through `Intl`. Engines without `formatToParts` (very old
 * React Native / Hermes builds) still get one usable `integer` part rather
 * than an exception.
 */
function numberParts(format: Intl.NumberFormat, value: number): CurrencyPart[] {
  const toParts = (
    format as unknown as {
      formatToParts?: (v: number) => readonly { type: string; value: string }[];
    }
  ).formatToParts;
  if (typeof toParts !== "function") {
    return [{ type: "integer", value: format.format(value) }];
  }
  return toParts.call(format, value).map((part) => ({
    type: (NUMBER_PART_TYPES.has(part.type)
      ? part.type
      : "literal") as CurrencyPartType,
    value: part.value,
  }));
}

function symbolPart(resolved: ResolvedFormat): CurrencyPart {
  const value = resolveCurrencySymbol(resolved.currency, {
    mode: resolved.mode,
    locale: resolved.locale,
  });
  const sign = getSymbolData(resolved.currency)?.unicode;
  const isDedicatedSign = !!sign && value === sign.char;
  return isDedicatedSign
    ? {
        type: "currency",
        value,
        symbolMode: resolved.mode,
        codepoint: sign.codepoint,
        needsFont: true,
      }
    : { type: "currency", value, symbolMode: resolved.mode, needsFont: false };
}

function attachSymbol(
  body: readonly CurrencyPart[],
  resolved: ResolvedFormat,
): CurrencyPart[] {
  const symbol = symbolPart(resolved);
  const gap: CurrencyPart[] = resolved.spacing
    ? [{ type: "literal", value: resolved.spacing }]
    : [];
  return resolved.position === "before"
    ? [symbol, ...gap, ...body]
    : [...body, ...gap, symbol];
}

function withParentheses(
  parts: readonly CurrencyPart[],
  negative: boolean,
): CurrencyPart[] {
  if (!negative) return [...parts];
  return [
    { type: "parenthesis", value: "(" },
    ...parts,
    { type: "parenthesis", value: ")" },
  ];
}

function withIsolate(
  parts: readonly CurrencyPart[],
  on: boolean,
): CurrencyPart[] {
  if (!on) return [...parts];
  return [
    { type: "isolate", value: FSI },
    ...parts,
    { type: "isolate", value: PDI },
  ];
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
    name: string;
    unicodeVersion: string;
    released: string;
    live: boolean;
    autoDefault: boolean;
    authority: string;
    announced: string;
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
      name: data.unicode.name,
      unicodeVersion: data.unicode.unicodeVersion,
      released: data.unicode.released,
      live: data.unicode.live,
      autoDefault: data.unicode.autoDefault,
      authority: data.unicode.authority,
      announced: data.unicode.announced,
    };
  }
  const name = intlDisplayName(upper, locale);
  if (name) info.displayName = name;
  return info;
}

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
