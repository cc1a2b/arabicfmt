/**
 * Curated currency-symbol data — the heart of arabicfmt.
 *
 * CLDR and `Intl` still ship the *old* symbols for the currencies caught up in
 * the 2025–2026 Unicode transition, so the symbols below are maintained by hand
 * and cross-checked against the Unicode proposals. Precision (minor-unit digits)
 * is NOT here — that comes from CLDR via ./data.generated.ts.
 */

/**
 * The legacy "Rial" ligature, U+FDFC (﷼). It encodes the **Iranian** rial and
 * must never be used for the Saudi riyal (which now has its own sign, U+20C1).
 * Exported so callers and tests can guard against it explicitly.
 */
export const LEGACY_RIAL_LIGATURE = "﷼";

export interface UnicodeSymbol {
  /** The dedicated sign itself, e.g. "⃁" for the Saudi riyal. */
  readonly char: string;
  /** Human-readable codepoint label, e.g. "U+20C1". */
  readonly codepoint: string;
  /** Unicode version that introduces (or introduced) the sign. */
  readonly unicodeVersion: string;
  /** Month the introducing Unicode version is/was released. */
  readonly released: string;
  /** True once the introducing Unicode version has shipped. */
  readonly live: boolean;
  /**
   * Whether `symbolMode: "auto"` should prefer this sign. Since Unicode 18.0
   * (September 2026) this is `true` for the AED and OMR signs. The Saudi
   * riyal (U+20C1) deliberately stays `false` — it is the
   * most-traded Gulf currency, so its default remains the safe text symbol that
   * renders everywhere; opt into the sign with `symbolMode: "new"`.
   */
  readonly autoDefault: boolean;
}

export interface CurrencySymbolData {
  /** ISO 4217 code. */
  readonly code: string;
  /** Arabic abbreviation that renders in every font, e.g. "ر.س". */
  readonly text: string;
  /** Dedicated Unicode sign + transition metadata, when one exists. */
  readonly unicode?: UnicodeSymbol;
}

const SAR_UNICODE: UnicodeSymbol = {
  char: "⃁",
  codepoint: "U+20C1",
  unicodeVersion: "17.0",
  released: "2025-09",
  live: true, // shipped in Unicode 17.0
  autoDefault: false, // most system fonts still lack the glyph
};

const AED_UNICODE: UnicodeSymbol = {
  char: "⃃",
  codepoint: "U+20C3",
  unicodeVersion: "18.0",
  released: "2026-09",
  live: true, // shipped in Unicode 18.0
  autoDefault: true, // `auto` prefers the dedicated dirham sign (Unicode 18.0)
};

const OMR_UNICODE: UnicodeSymbol = {
  char: "⃄",
  codepoint: "U+20C4",
  unicodeVersion: "18.0",
  released: "2026-09",
  live: true, // shipped in Unicode 18.0
  autoDefault: true, // `auto` prefers the dedicated rial sign (Unicode 18.0)
};

/**
 * Curated symbols for the 22 Arab League currencies (plus ILS, which circulates
 * in the Palestinian territories). Keyed by ISO 4217 code.
 */
export const CURRENCY_SYMBOLS: Readonly<Record<string, CurrencySymbolData>> = {
  // Gulf — the transition currencies
  SAR: { code: "SAR", text: "ر.س", unicode: SAR_UNICODE },
  AED: { code: "AED", text: "د.إ", unicode: AED_UNICODE },
  OMR: { code: "OMR", text: "ر.ع.", unicode: OMR_UNICODE },
  // Other dinars (3 decimals) and riyals
  KWD: { code: "KWD", text: "د.ك" },
  BHD: { code: "BHD", text: "د.ب" },
  QAR: { code: "QAR", text: "ر.ق" },
  JOD: { code: "JOD", text: "د.أ" },
  IQD: { code: "IQD", text: "د.ع" },
  LYD: { code: "LYD", text: "د.ل" },
  TND: { code: "TND", text: "د.ت" },
  YER: { code: "YER", text: "ر.ي" },
  // Pounds / liras
  EGP: { code: "EGP", text: "ج.م" },
  SDG: { code: "SDG", text: "ج.س" },
  LBP: { code: "LBP", text: "ل.ل" },
  SYP: { code: "SYP", text: "ل.س" },
  // Dirham / dinar (Maghreb)
  MAD: { code: "MAD", text: "د.م." },
  DZD: { code: "DZD", text: "د.ج" },
  // Others
  MRU: { code: "MRU", text: "أ.م" },
  SOS: { code: "SOS", text: "ش.ص" },
  DJF: { code: "DJF", text: "ف.ج" },
  KMF: { code: "KMF", text: "ف.ج.ق" },
  ILS: { code: "ILS", text: "₪" },
};

/** Look up curated symbol data for an ISO 4217 code (case-insensitive). */
export function getSymbolData(code: string): CurrencySymbolData | undefined {
  return CURRENCY_SYMBOLS[code.toUpperCase()];
}
