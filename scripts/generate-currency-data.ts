/**
 * Generates `src/currency/data.generated.ts` from CLDR supplemental data.
 *
 * We deliberately derive *precision* (minor-unit digits) and *region → currency*
 * mappings from CLDR rather than hand-typing them, so the numbers that every
 * other library gets wrong (3-decimal dinars, 0-decimal francs) come straight
 * from the canonical source. Currency *symbols* are curated separately in
 * `src/currency/symbols.ts` because the 2025–2026 Unicode transition is ahead of
 * what CLDR ships.
 *
 * Run with: npm run generate
 */
import { createRequire } from "node:module";
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const require = createRequire(import.meta.url);
const here = dirname(fileURLToPath(import.meta.url));

interface FractionEntry {
  _digits?: string;
  _rounding?: string;
  _cashDigits?: string;
  _cashRounding?: string;
}
interface RegionCurrencyMeta {
  _from?: string;
  _to?: string;
  _tender?: string;
}

const currencyData = require("cldr-core/supplemental/currencyData.json")
  .supplemental.currencyData as {
  fractions: Record<string, FractionEntry>;
  region: Record<string, Array<Record<string, RegionCurrencyMeta>>>;
};
const cldrVersion = require("cldr-core/package.json").version as string;

const DEFAULT_DIGITS = Number(currencyData.fractions["DEFAULT"]?._digits ?? "2");

// --- precision: every currency whose digit count deviates from the default ---
const digits: Record<string, number> = {};
for (const [code, entry] of Object.entries(currencyData.fractions)) {
  if (code === "DEFAULT") continue;
  const d = Number(entry._digits ?? DEFAULT_DIGITS);
  if (d !== DEFAULT_DIGITS) digits[code] = d;
}

// --- region → primary currency ----------------------------------------------
// "Primary" = the most recently adopted currency that is still legal tender
// (no `_to` end date). Among Arab League members only Palestine has more than
// one concurrent legal tender; this rule selects JOD (adopted 1996) there.
function primaryCurrency(
  entries: Array<Record<string, RegionCurrencyMeta>>,
): string | undefined {
  let best: { code: string; from: string } | undefined;
  for (const entry of entries) {
    const code = Object.keys(entry)[0];
    if (!code) continue;
    const meta = entry[code]!;
    if (meta._to) continue; // historical, no longer tender
    if (code === "XXX" || code === "XAG" || code === "XAU") continue;
    const from = meta._from ?? "0000-00-00";
    if (!best || from > best.from) best = { code, from };
  }
  return best?.code;
}

const region: Record<string, string> = {};
for (const [code, entries] of Object.entries(currencyData.region)) {
  if (code.length !== 2) continue; // skip groupings like "EU"
  const primary = primaryCurrency(entries);
  if (primary) region[code] = primary;
}

function serialize(obj: Record<string, number | string>): string {
  const keys = Object.keys(obj).sort();
  const lines = keys.map((k) => {
    const v = obj[k]!;
    const value = typeof v === "number" ? v : JSON.stringify(v);
    return `  ${JSON.stringify(k)}: ${value},`;
  });
  return `{\n${lines.join("\n")}\n}`;
}

const out = `// AUTO-GENERATED FILE — DO NOT EDIT BY HAND.
// Source: cldr-core@${cldrVersion} (Unicode CLDR).
// Regenerate with: npm run generate
//
// Minor-unit precision and region→currency mappings are derived from CLDR so
// they stay correct and verifiable. Curated symbol data lives in ./symbols.ts.

/** Version of the CLDR dataset these tables were generated from. */
export const CLDR_VERSION = ${JSON.stringify(cldrVersion)};

/** Default minor-unit digit count for currencies not listed in CURRENCY_DIGITS. */
export const DEFAULT_CURRENCY_DIGITS = ${DEFAULT_DIGITS};

/**
 * Minor-unit (decimal) digits per ISO 4217 code, for every currency whose
 * precision differs from the default of ${DEFAULT_DIGITS}. Anything absent here uses
 * DEFAULT_CURRENCY_DIGITS.
 */
export const CURRENCY_DIGITS: Readonly<Record<string, number>> = ${serialize(digits)};

/** ISO 3166-1 alpha-2 region → primary ISO 4217 currency code. */
export const REGION_CURRENCY: Readonly<Record<string, string>> = ${serialize(region)};
`;

const target = resolve(here, "../src/currency/data.generated.ts");
writeFileSync(target, out, "utf8");

console.log(
  `Wrote ${target}\n  CLDR ${cldrVersion}: ${Object.keys(digits).length} non-default precisions, ${Object.keys(region).length} regions.`,
);
