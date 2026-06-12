import type { NumeralSystem } from "./types";

/** Default locale used across the library when none is supplied. */
export const DEFAULT_LOCALE = "ar";

/**
 * Extract the region (ISO 3166-1 alpha-2, upper-cased) from a BCP-47 tag.
 *
 * Parsed by hand rather than via `Intl.Locale` so it works on runtimes with a
 * limited `Intl` (older React Native / Hermes). Returns `undefined` when the tag
 * carries no region subtag.
 *
 * @example regionFromLocale("ar-SA") // "SA"
 * @example regionFromLocale("ar-Arab-EG") // "EG"
 * @example regionFromLocale("ar") // undefined
 */
export function regionFromLocale(locale: string): string | undefined {
  const parts = locale.replace(/_/g, "-").split("-");
  for (let i = 1; i < parts.length; i++) {
    const part = parts[i]!;
    if (/^[A-Za-z]{2}$/.test(part)) return part.toUpperCase();
    if (/^\d{3}$/.test(part)) return part; // UN M.49 area code
  }
  return undefined;
}

/**
 * Return `locale` with its numbering system forced to `ns`. Prefers
 * `Intl.Locale` and falls back to direct tag manipulation where it is absent.
 */
export function withNumberingSystem(
  locale: string,
  ns: NumeralSystem,
): string {
  const IntlLocale = (
    Intl as unknown as { Locale?: new (t: string, o?: object) => { toString(): string } }
  ).Locale;
  if (IntlLocale) {
    try {
      return new IntlLocale(locale, { numberingSystem: ns }).toString();
    } catch {
      /* fall through to manual handling */
    }
  }
  const base = locale.replace(/-u-.*$/i, "");
  return `${base}-u-nu-${ns}`;
}

/**
 * Detect the best Arabic locale for the current runtime environment.
 *
 * Priority:
 * 1. `navigator.language` (browser / React Native)
 * 2. `navigator.languages[0]` (browser fallback)
 * 3. `process.env.LANG` / `LANGUAGE` / `LC_ALL` / `LC_MESSAGES` (Node.js)
 * 4. `"ar"` (universal fallback)
 *
 * @example
 * // In a Saudi browser:
 * detectLocale() // "ar-SA"
 *
 * // In a Node process with LANG=ar_EG.UTF-8:
 * detectLocale() // "ar-EG"
 */
export function detectLocale(): string {
  // Browser / React Native
  if (typeof navigator !== "undefined") {
    if (navigator.language) return navigator.language;
    const nav = navigator as unknown as { languages?: readonly string[] };
    if (Array.isArray(nav.languages) && nav.languages.length > 0) {
      const first = nav.languages[0];
      if (first) return first;
    }
  }

  // Node.js — parse POSIX locale env vars
  if (typeof process !== "undefined" && process.env) {
    for (const key of ["LANG", "LANGUAGE", "LC_ALL", "LC_MESSAGES"]) {
      const val = process.env[key];
      if (val && val !== "C" && val !== "POSIX") {
        // "ar_SA.UTF-8" → "ar-SA"
        return val.split(".")[0]!.replace(/_/g, "-");
      }
    }
  }

  return DEFAULT_LOCALE;
}
