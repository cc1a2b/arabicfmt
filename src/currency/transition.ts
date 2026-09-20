/**
 * The Unicode currency-sign transition, as queryable data.
 *
 * Between 2025 and 2026 four currencies moved from an ad-hoc abbreviation to a
 * dedicated Unicode sign: the Saudi riyal (U+20C1, Unicode 17.0) and then the
 * Maldivian rufiyaa, UAE dirham and Omani rial (U+20C2–U+20C4, Unicode 18.0).
 * Every one of them now has a period where the sign is *announced* by its
 * central bank but not yet *encoded*, and a much longer period where it is
 * encoded but system fonts still draw a blank box.
 *
 * Shipping software has to reason about that timeline — which symbol to print,
 * when to load a webfont, what to tell a user staring at a tofu box. This
 * module turns the timeline into data derived from {@link CURRENCY_SYMBOLS},
 * so the facts are stated exactly once.
 */

import { CURRENCY_SYMBOLS } from "./symbols";

/**
 * Release date of each Unicode version that encoded one of these signs. Kept
 * here rather than on every symbol so the date is written once per version.
 */
const UNICODE_RELEASE_DATES: Readonly<Record<string, string>> = {
  "17.0": "2025-09-09",
  "18.0": "2026-09-16",
};

/**
 * Where a currency sits on the transition timeline:
 * - `none` — no dedicated sign exists (yet) at the evaluated moment.
 * - `announced` — the monetary authority has issued the sign, but the Unicode
 *   version that encodes it has not shipped. Nothing can render it portably.
 * - `encoded` — the sign is in the standard; rendering now depends on fonts.
 */
export type TransitionStatus = "none" | "announced" | "encoded";

/** Everything arabicfmt knows about one currency's move to a dedicated sign. */
export interface CurrencyTransition {
  /** ISO 4217 code, e.g. `"SAR"`. */
  readonly code: string;
  /** The dedicated sign itself. */
  readonly sign: string;
  /** Codepoint label, e.g. `"U+20C1"`. */
  readonly codepoint: string;
  /** Formal Unicode character name, e.g. `"SAUDI RIYAL SIGN"`. */
  readonly name: string;
  /** Unicode version that encoded the sign, e.g. `"17.0"`. */
  readonly unicodeVersion: string;
  /** ISO date that Unicode version was released. */
  readonly unicodeReleased: string;
  /** ISO date the monetary authority unveiled the sign. */
  readonly announced: string;
  /** The monetary authority that issued it. */
  readonly authority: string;
  /** Whether `symbolMode: "auto"` prefers the sign over the text symbol. */
  readonly autoDefault: boolean;
  /** The abbreviation that renders in every font today, e.g. `"ر.س"`. */
  readonly textSymbol: string;
}

function build(): CurrencyTransition[] {
  const out: CurrencyTransition[] = [];
  for (const data of Object.values(CURRENCY_SYMBOLS)) {
    const u = data.unicode;
    if (!u) continue;
    out.push({
      code: data.code,
      sign: u.char,
      codepoint: u.codepoint,
      name: u.name,
      unicodeVersion: u.unicodeVersion,
      unicodeReleased: UNICODE_RELEASE_DATES[u.unicodeVersion] ?? `${u.released}-01`,
      announced: u.announced,
      authority: u.authority,
      autoDefault: u.autoDefault,
      textSymbol: data.text,
    });
  }
  return out.sort((a, b) => a.codepoint.localeCompare(b.codepoint));
}

/**
 * Every currency with a dedicated Unicode sign, in codepoint order
 * (U+20C1 SAR, U+20C2 MVR, U+20C3 AED, U+20C4 OMR).
 */
export const CURRENCY_TRANSITIONS: readonly CurrencyTransition[] = build();

/** Transition record for an ISO 4217 code, if the currency has a sign. */
export function getCurrencyTransition(
  code: string,
): CurrencyTransition | undefined {
  const upper = code.toUpperCase();
  return CURRENCY_TRANSITIONS.find((t) => t.code === upper);
}

export interface ListTransitionsOptions {
  /** Keep only signs encoded by this Unicode version, e.g. `"18.0"`. */
  unicodeVersion?: string;
  /** Keep only signs already encoded at {@link ListTransitionsOptions.at}. */
  encodedOnly?: boolean;
  /** Moment to evaluate status against. Default: now. */
  at?: Date;
}

/**
 * List the currency-sign transitions, optionally filtered.
 *
 * @example
 * listCurrencyTransitions({ unicodeVersion: "18.0" }).map((t) => t.code)
 * // ["MVR", "AED", "OMR"]
 *
 * @example
 * // What could a browser render in mid-2026, before Unicode 18.0 shipped?
 * listCurrencyTransitions({ encodedOnly: true, at: new Date("2026-06-01") })
 * // only the Saudi riyal
 */
export function listCurrencyTransitions(
  options: ListTransitionsOptions = {},
): CurrencyTransition[] {
  const at = options.at ?? new Date();
  return CURRENCY_TRANSITIONS.filter((t) => {
    if (options.unicodeVersion && t.unicodeVersion !== options.unicodeVersion) {
      return false;
    }
    if (options.encodedOnly && transitionStatus(t.code, at) !== "encoded") {
      return false;
    }
    return true;
  });
}

/**
 * Where a currency stood on the transition timeline at a given moment.
 *
 * @example transitionStatus("SAR")                            // "encoded"
 * @example transitionStatus("SAR", new Date("2025-03-01"))    // "announced"
 * @example transitionStatus("AED", new Date("2026-01-01"))    // "announced"
 * @example transitionStatus("KWD")                            // "none" — Kuwait has no sign
 */
export function transitionStatus(
  code: string,
  at: Date = new Date(),
): TransitionStatus {
  const transition = getCurrencyTransition(code);
  if (!transition) return "none";

  const moment = at.getTime();
  if (Number.isNaN(moment)) {
    throw new TypeError("arabicfmt: transitionStatus received an invalid Date.");
  }
  if (moment < Date.parse(transition.announced)) return "none";
  if (moment < Date.parse(transition.unicodeReleased)) return "announced";
  return "encoded";
}

// --- webfont helpers ---------------------------------------------------------

function resolveCodepoints(currencies?: readonly string[]): string[] {
  if (!currencies) return CURRENCY_TRANSITIONS.map((t) => t.codepoint);
  return currencies.map((code) => {
    const transition = getCurrencyTransition(code);
    if (!transition) {
      throw new RangeError(
        `arabicfmt: ${code.toUpperCase()} has no dedicated Unicode sign. Signs exist for ${CURRENCY_TRANSITIONS.map((t) => t.code).join(", ")}.`,
      );
    }
    return transition.codepoint;
  });
}

/**
 * The CSS `unicode-range` value covering the dedicated currency signs.
 *
 * @example signUnicodeRange()                 // "U+20C1, U+20C2, U+20C3, U+20C4"
 * @example signUnicodeRange(["SAR"])          // "U+20C1"
 */
export function signUnicodeRange(currencies?: readonly string[]): string {
  return [...new Set(resolveCodepoints(currencies))].sort().join(", ");
}

export interface SignFontFaceOptions {
  /** Font URL, or several in `src` fallback order (woff2 first). */
  src: string | readonly string[];
  /** `font-family` the rule declares. Default `"Arabicfmt Signs"`. */
  family?: string;
  /** `font-display` strategy. Default `"swap"`. */
  display?: "auto" | "block" | "swap" | "fallback" | "optional";
  /** Restrict the range to these ISO codes. Default: every sign. */
  currencies?: readonly string[];
  /** Optional `font-weight` descriptor. */
  weight?: string;
  /** Optional `font-style` descriptor. */
  style?: string;
}

const FONT_FORMATS: readonly (readonly [RegExp, string])[] = [
  [/\.woff2(?:[?#]|$)/i, "woff2"],
  [/\.woff(?:[?#]|$)/i, "woff"],
  [/\.ttf(?:[?#]|$)/i, "truetype"],
  [/\.otf(?:[?#]|$)/i, "opentype"],
];

// A URL or family name carrying quotes, semicolons or braces would break out of
// the rule it is interpolated into, so reject them instead of emitting them.
const CSS_UNSAFE = /["'\\;{}()<>]|\s/;

// Descriptor values are plain keywords, numbers or ranges ("swap", "400 700",
// "italic", "oblique 10deg") — anything else is rejected rather than emitted.
function descriptor(value: string, field: string): string {
  if (!/^[a-zA-Z0-9][a-zA-Z0-9 .%-]*$/.test(value)) {
    throw new TypeError(
      `arabicfmt: ${field} must be a plain CSS keyword or number (got ${JSON.stringify(value)}).`,
    );
  }
  return value;
}

function assertCssSafe(value: string, field: string): void {
  if (!value || CSS_UNSAFE.test(value)) {
    throw new TypeError(
      `arabicfmt: ${field} must be a non-empty string without quotes, whitespace, parentheses, braces or semicolons (got ${JSON.stringify(value)}).`,
    );
  }
}

/**
 * Generate the scoped `@font-face` rule that makes the new currency signs
 * render, without touching any other glyph on the page.
 *
 * The `unicode-range` descriptor is the whole trick: the browser downloads the
 * font only when one of those four codepoints is actually painted, so shipping
 * a riyal webfont costs nothing on pages that never print a riyal.
 *
 * @example
 * signFontFaceCSS({ src: "/fonts/currency-signs.woff2" });
 * // @font-face {
 * //   font-family: "Arabicfmt Signs";
 * //   src: url("/fonts/currency-signs.woff2") format("woff2");
 * //   font-display: swap;
 * //   unicode-range: U+20C1, U+20C2, U+20C3, U+20C4;
 * // }
 *
 * @example
 * // Saudi riyal only, into a named family you already use:
 * signFontFaceCSS({ src: "/fonts/riyal.woff2", family: "Riyal", currencies: ["SAR"] });
 */
export function signFontFaceCSS(options: SignFontFaceOptions): string {
  const family = options.family ?? "Arabicfmt Signs";
  if (!family.trim() || /["'\\;{}]/.test(family)) {
    throw new TypeError(
      `arabicfmt: font family must be a non-empty string without quotes, braces or semicolons (got ${JSON.stringify(family)}).`,
    );
  }

  const sources = typeof options.src === "string" ? [options.src] : [...options.src];
  if (sources.length === 0) {
    throw new TypeError("arabicfmt: signFontFaceCSS needs at least one src URL.");
  }
  for (const src of sources) assertCssSafe(src, "font src URL");

  const srcValue = sources
    .map((src) => {
      const format = FONT_FORMATS.find(([pattern]) => pattern.test(src))?.[1];
      return format ? `url("${src}") format("${format}")` : `url("${src}")`;
    })
    .join(",\n       ");

  const lines = [
    "@font-face {",
    `  font-family: "${family}";`,
    `  src: ${srcValue};`,
  ];
  if (options.style) lines.push(`  font-style: ${descriptor(options.style, "font-style")};`);
  if (options.weight) lines.push(`  font-weight: ${descriptor(options.weight, "font-weight")};`);
  lines.push(`  font-display: ${descriptor(options.display ?? "swap", "font-display")};`);
  lines.push(`  unicode-range: ${signUnicodeRange(options.currencies)};`);
  lines.push("}");
  return lines.join("\n");
}
