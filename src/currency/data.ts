import { regionFromLocale } from "../locale";
import {
  CURRENCY_DIGITS,
  DEFAULT_CURRENCY_DIGITS,
  REGION_CURRENCY,
} from "./data.generated";

export { CLDR_VERSION } from "./data.generated";

/**
 * Deliberate precision overrides on top of CLDR.
 *
 * CLDR records the *practical* number of decimals shown for cash, which for the
 * Iraqi dinar is 0 (fils coins left circulation during hyperinflation). ISO 4217
 * still defines IQD with **3** minor-unit digits, and a correctness-focused
 * formatter should preserve that, so we override it here. This is the only place
 * the library departs from CLDR precision — and it is asserted by the build-time
 * verifier so it can never drift silently.
 */
export const PRECISION_OVERRIDES: Readonly<Record<string, number>> = {
  IQD: 3,
};

/** Minor-unit (decimal) digit count for an ISO 4217 code. */
export function currencyDigits(code: string): number {
  const c = code.toUpperCase();
  return PRECISION_OVERRIDES[c] ?? CURRENCY_DIGITS[c] ?? DEFAULT_CURRENCY_DIGITS;
}

/** Primary currency for an ISO 3166-1 alpha-2 region, per CLDR. */
export function currencyForRegion(region: string): string | undefined {
  return REGION_CURRENCY[region.toUpperCase()];
}

/** Primary currency implied by a BCP-47 locale's region subtag, if any. */
export function currencyForLocale(locale: string): string | undefined {
  const region = regionFromLocale(locale);
  return region ? currencyForRegion(region) : undefined;
}
