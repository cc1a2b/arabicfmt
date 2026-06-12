/**
 * IBAN validation and formatting (ISO 13616).
 *
 * Validity is the real ISO 7064 mod-97 checksum — not a regex guess — plus a
 * country length check from the SWIFT IBAN registry. Length is only enforced
 * for countries in {@link IBAN_LENGTHS}; others still get the checksum + the
 * general 15–34 character bound, so unknown-country IBANs are never wrongly
 * accepted on checksum alone.
 */

/**
 * Total IBAN length per country (ISO 3166-1 alpha-2), from the SWIFT registry.
 * Covers the Arab League countries that issue IBANs plus common partners.
 */
export const IBAN_LENGTHS: Readonly<Record<string, number>> = {
  // Arab League
  SA: 24, AE: 23, KW: 30, BH: 22, QA: 29, JO: 30, LB: 28, EG: 29,
  IQ: 23, PS: 29, TN: 24, MR: 27, LY: 25,
  // Common partners
  GB: 22, DE: 22, FR: 27, NL: 18, ES: 24, IT: 27, CH: 21, BE: 16,
  TR: 26, PT: 25, PK: 24,
};

/** Move a–z/A–Z to 10–35 and join with the existing digits (ISO 13616). */
function toNumericString(rearranged: string): string {
  let out = "";
  for (const ch of rearranged) {
    const code = ch.charCodeAt(0);
    out += code >= 65 && code <= 90 ? (code - 55).toString() : ch;
  }
  return out;
}

/** ISO 7064 mod-97-10 over a (possibly very long) numeric string. */
function mod97(numeric: string): number {
  let remainder = 0;
  for (let i = 0; i < numeric.length; i++) {
    remainder = (remainder * 10 + (numeric.charCodeAt(i) - 48)) % 97;
  }
  return remainder;
}

/** Strip spaces and upper-case — the canonical electronic IBAN form. */
export function normalizeIBAN(iban: string): string {
  return iban.replace(/\s+/g, "").toUpperCase();
}

/**
 * Validate an IBAN: structure, registry length (when known), and the mod-97
 * checksum.
 *
 * @example isValidIBAN("SA03 8000 0000 6080 1016 7519") // true
 * @example isValidIBAN("SA03 8000 0000 6080 1016 7510") // false (bad checksum)
 */
export function isValidIBAN(iban: string): boolean {
  const cleaned = normalizeIBAN(iban);
  if (!/^[A-Z]{2}[0-9]{2}[A-Z0-9]+$/.test(cleaned)) return false;
  if (cleaned.length < 15 || cleaned.length > 34) return false;

  const expected = IBAN_LENGTHS[cleaned.slice(0, 2)];
  if (expected !== undefined && cleaned.length !== expected) return false;

  const rearranged = cleaned.slice(4) + cleaned.slice(0, 4);
  return mod97(toNumericString(rearranged)) === 1;
}

export interface FormatIBANOptions {
  /** Group separator. Default a single space (`"SA03 8000 …"`). */
  separator?: string;
}

/**
 * Format an IBAN into groups of four for display.
 *
 * @example formatIBAN("SA0380000000608010167519") // "SA03 8000 0000 6080 1016 7519"
 */
export function formatIBAN(iban: string, options: FormatIBANOptions = {}): string {
  const cleaned = normalizeIBAN(iban);
  const separator = options.separator ?? " ";
  return (cleaned.match(/.{1,4}/g) ?? []).join(separator);
}
