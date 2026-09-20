/**
 * Build-time guard for the currency data. Runs on `npm run verify` (and as a
 * `prebuild` step) so the library can never publish precision data that has
 * drifted from CLDR or symbol data that has been corrupted.
 *
 * It asserts:
 *   1. the generated tables were built from the installed CLDR version;
 *   2. minor-unit precision matches CLDR everywhere except documented overrides;
 *   3. the 3-decimal dinars and 0-decimal francs are exactly right;
 *   4. every Arab League country resolves to a currency with a curated symbol;
 *   5. each curated Unicode sign matches its declared codepoint, the
 *      SAR/MVR/AED/OMR signs are U+20C1 / U+20C2 / U+20C3 / U+20C4, and none is
 *      the legacy U+FDFC;
 *   6. the transition registry mirrors the symbol table exactly, every sign has
 *      a known Unicode release date that follows its announcement, and the
 *      generated webfont CSS covers every sign.
 */
import { createRequire } from "node:module";

import { ARAB_LEAGUE_COUNTRIES, countryCurrency } from "../src/countries";
import {
  CLDR_VERSION,
  currencyDigits,
  PRECISION_OVERRIDES,
} from "../src/currency/data";
import {
  CURRENCY_SYMBOLS,
  getSymbolData,
  LEGACY_RIAL_LIGATURE,
} from "../src/currency/symbols";
import {
  CURRENCY_TRANSITIONS,
  signFontFaceCSS,
  transitionStatus,
} from "../src/currency/transition";

const require = createRequire(import.meta.url);

const failures: string[] = [];
function check(condition: boolean, message: string): void {
  if (!condition) failures.push(message);
}

const cldr = require("cldr-core/supplemental/currencyData.json").supplemental
  .currencyData as { fractions: Record<string, { _digits?: string }> };
const installedCldrVersion = require("cldr-core/package.json").version as string;

// 1. Generated tables match the installed CLDR release.
check(
  CLDR_VERSION === installedCldrVersion,
  `CLDR_VERSION ${CLDR_VERSION} != installed cldr-core ${installedCldrVersion}. Run: npm run generate`,
);

// 2. Precision matches CLDR except for documented overrides.
const defaultDigits = Number(cldr.fractions["DEFAULT"]?._digits ?? "2");
for (const [code, entry] of Object.entries(cldr.fractions)) {
  if (code === "DEFAULT") continue;
  const cldrDigits = Number(entry._digits ?? defaultDigits);
  const override = PRECISION_OVERRIDES[code];
  const expected = override ?? cldrDigits;
  check(
    currencyDigits(code) === expected,
    `precision drift for ${code}: got ${currencyDigits(code)}, expected ${expected}`,
  );
}
// Overrides must be intentional and actually differ from CLDR.
for (const [code, value] of Object.entries(PRECISION_OVERRIDES)) {
  const cldrDigits = Number(cldr.fractions[code]?._digits ?? defaultDigits);
  check(
    value !== cldrDigits,
    `override for ${code} (${value}) matches CLDR (${cldrDigits}) and is redundant`,
  );
}
check(
  Object.keys(PRECISION_OVERRIDES).join(",") === "IQD",
  `unexpected PRECISION_OVERRIDES keys: ${Object.keys(PRECISION_OVERRIDES).join(",")}`,
);

// 3. The headline precision cases.
for (const code of ["BHD", "IQD", "JOD", "KWD", "LYD", "OMR", "TND"]) {
  check(currencyDigits(code) === 3, `${code} should have 3 decimals`);
}
for (const code of ["DJF", "KMF"]) {
  check(currencyDigits(code) === 0, `${code} should have 0 decimals`);
}
for (const code of ["SAR", "AED", "QAR", "MAD"]) {
  check(currencyDigits(code) === 2, `${code} should have 2 decimals`);
}

// 4. Every Arab League country resolves to a currency with a curated symbol.
check(
  ARAB_LEAGUE_COUNTRIES.length === 22,
  `expected 22 Arab League countries, found ${ARAB_LEAGUE_COUNTRIES.length}`,
);
for (const country of ARAB_LEAGUE_COUNTRIES) {
  const currency = countryCurrency(country.region);
  check(!!currency, `no currency resolved for ${country.region}`);
  if (currency) {
    check(
      !!getSymbolData(currency),
      `no curated symbol for ${currency} (${country.region})`,
    );
  }
}

// 5. Symbol integrity.
const expectedSigns: Record<string, string> = {
  SAR: "U+20C1",
  MVR: "U+20C2",
  AED: "U+20C3",
  OMR: "U+20C4",
};
for (const data of Object.values(CURRENCY_SYMBOLS)) {
  check(
    data.text !== LEGACY_RIAL_LIGATURE,
    `${data.code} text symbol must not be the legacy U+FDFC ligature`,
  );
  if (data.unicode) {
    const actual =
      "U+" +
      (data.unicode.char.codePointAt(0) ?? 0)
        .toString(16)
        .toUpperCase()
        .padStart(4, "0");
    check(
      actual === data.unicode.codepoint,
      `${data.code} sign ${actual} != declared ${data.unicode.codepoint}`,
    );
    const expected = expectedSigns[data.code];
    if (expected) {
      check(
        actual === expected,
        `${data.code} sign should be ${expected}, got ${actual}`,
      );
    }
  }
}

// 6. The transition registry mirrors the symbol table, and its dates are sane.
const signedCodes = Object.values(CURRENCY_SYMBOLS)
  .filter((d) => d.unicode)
  .map((d) => d.code)
  .sort();
check(
  CURRENCY_TRANSITIONS.map((t) => t.code).sort().join(",") === signedCodes.join(","),
  `transition registry ${CURRENCY_TRANSITIONS.map((t) => t.code).sort().join(",")} != signed currencies ${signedCodes.join(",")}`,
);
for (const transition of CURRENCY_TRANSITIONS) {
  const announced = Date.parse(transition.announced);
  const released = Date.parse(transition.unicodeReleased);
  check(
    !Number.isNaN(announced),
    `${transition.code} announcement date ${transition.announced} is unparseable`,
  );
  check(
    !Number.isNaN(released),
    `${transition.code} has no known release date for Unicode ${transition.unicodeVersion}`,
  );
  check(
    announced <= released,
    `${transition.code} was announced (${transition.announced}) after Unicode encoded it (${transition.unicodeReleased})`,
  );
  check(
    transitionStatus(transition.code, new Date(released)) === "encoded",
    `${transition.code} should read as "encoded" on its Unicode release date`,
  );
  check(
    transitionStatus(transition.code, new Date(announced)) === "announced",
    `${transition.code} should read as "announced" on its announcement date`,
  );
  check(
    transition.textSymbol.length > 0 && transition.sign.length > 0,
    `${transition.code} is missing a text symbol or sign`,
  );
}

const fontFaceCSS = signFontFaceCSS({ src: "/fonts/signs.woff2" });
for (const transition of CURRENCY_TRANSITIONS) {
  check(
    fontFaceCSS.includes(transition.codepoint),
    `generated @font-face is missing ${transition.code} (${transition.codepoint})`,
  );
}

if (failures.length > 0) {
  console.error(`✗ currency data verification failed (${failures.length}):`);
  for (const f of failures) console.error(`  - ${f}`);
  process.exit(1);
}
console.log(
  `✓ currency data verified against CLDR ${installedCldrVersion} (22 countries, ${Object.keys(CURRENCY_SYMBOLS).length} curated symbols, ${CURRENCY_TRANSITIONS.length} Unicode signs: ${CURRENCY_TRANSITIONS.map((t) => `${t.code} ${t.codepoint}`).join(", ")}).`,
);
