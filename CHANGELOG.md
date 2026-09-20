# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

## [0.1.5] — 2026-09-20

Unicode 18.0 shipped on 16 September 2026 with three new currency signs. This
release completes arabicfmt's coverage of that batch and adds the tooling a
product actually needs while fonts catch up.

### Added

- **The Unicode 18.0 sign batch is complete.** `U+20C2 RUFIYAA SIGN` (MVR) joins
  the dirham and rial signs, so every currency sign encoded in this transition —
  SAR U+20C1 (Unicode 17.0), MVR U+20C2, AED U+20C3, OMR U+20C4 (Unicode 18.0) —
  is curated, verified and formattable. Each sign now also carries its formal
  Unicode name, issuing authority and announcement date, exposed through
  `getCurrencyInfo()`.
  *(Kuwait has no currency sign: KWD remains `د.ك` / `KD`.)*
- **`formatCurrencyToParts()`** — the currency counterpart to
  `Intl.NumberFormat.prototype.formatToParts`. The `currency` part reports its
  `codepoint` and `needsFont`, so a UI can wrap exactly the new sign in a
  font-scoped element instead of splitting a finished string with a regex.
  `formatCurrency()` is now built on it, so string and parts can never diverge.
- **Transition registry** — `CURRENCY_TRANSITIONS`, `getCurrencyTransition()`,
  `listCurrencyTransitions()` and `transitionStatus(code, at)`, which answers
  `"none"` / `"announced"` / `"encoded"` for any moment in time (the gap between
  a central bank unveiling a sign and Unicode encoding it is 7–18 months, and
  software shipped in that window has to choose a symbol).
- **`signFontFaceCSS()` / `signUnicodeRange()`** — generate the scoped
  `@font-face` rule with the `unicode-range` that keeps a currency webfont from
  downloading on pages that never print the sign. Rejects values that would
  break out of the rule.
- **`formatCurrencyRange()`** — price ranges with one shared symbol and one
  shared precision, so a range can never render `1,200.5 – 1,300.00`.
- **`numerals: "arabext"`** — Extended Arabic-Indic digits (۰۱۲۳, Persian/Urdu)
  as a third numeral system across every formatter, plus
  `toExtendedArabicDigits()` and `shapeDigits()`.

### Fixed

- `formatCurrency()` with `accounting: true` and `showSymbol: false` dropped the
  negative sign entirely (`-5` formatted as `5.00`). It now renders `(5.00)`.

### MCP

- `arabicfmt-mcp` 0.1.2 adds `format_currency_range`, `format_currency_parts`,
  `currency_transition` and `currency_sign_css` (21 tools).
- Fixed `arabic_to_words` / `arabic_ordinal`, which passed a `feminine` flag the
  library never read — they now take `gender: "male" | "female"`, and
  `arabic_ordinal` takes `definite`. `format_duration` no longer advertises
  `locale` / `numerals` options it did not support, and takes `input` / `largest`
  instead.

### Verified

- The build-time data verifier now also asserts that the transition registry
  mirrors the symbol table, that every announcement date precedes its Unicode
  release date, that status transitions land on the right day, and that the
  generated `@font-face` covers every sign.

## [0.1.4] — 2026-07-06

MCP and release-infrastructure release; the library's runtime behavior and
public API are unchanged from 0.1.3.

### MCP
- Publish `arabicfmt-mcp` to the official MCP Registry as
  `io.github.cc1a2b/arabicfmt-mcp` (`mcp/server.json` plus a GitHub-OIDC
  publish workflow).
- Add a root `Dockerfile` that runs the MCP server over stdio so registry
  inspectors (e.g. Glama) can introspect it.

## [0.1.3] — 2026-07-03

Docs-and-examples release; runtime behavior and the public API are unchanged
from 0.1.2.

### Documentation
- Saudi-first examples throughout: Riyadh, Jeddah and SAR are now the featured
  examples across the README, demo, JSDoc and MCP tool descriptions. Currency
  data still covers all 22 Arab League countries.

## [0.1.2] — 2026-06-13

Docs-only release; the library code and public API are unchanged from 0.1.1.

### Documentation
- Add a full API reference table to the README (every exported function, by module).
- Add `llms.txt` and an FAQ + JSON-LD to the demo for AI/search discoverability.
- Version-proof the CDN examples (unversioned jsDelivr `+esm` URL).
- Add CONTRIBUTING, SECURITY, and issue/PR templates.

## [0.1.1] — 2026-06-13

### Documentation
- Rebuilt README: live-demo screenshots, a Browser/CDN section (jsDelivr `+esm`), and a refreshed badge line.

### Build
- Pin `esbuild` to `^0.28.1` via `overrides` to clear dev-tooling advisories. No runtime impact — the package still ships **zero dependencies**, and the public API is unchanged from 0.1.0.

## [0.1.0] — 2026-06-13

First public release.

### Currency — `arabicfmt/currency`

- `formatCurrency()` for all 22 Arab League currencies with CLDR-verified
  decimal precision (KWD/BHD/OMR/JOD/IQD/LYD/TND = 3 decimals, DJF/KMF = 0)
  and ISO 4217 overrides where CLDR differs (IQD).
- Full handling of the Unicode currency-sign transition: SAR U+20C1
  (Unicode 17.0), AED U+20C3 and OMR U+20C4 (Unicode 18.0 — live). Four
  symbol modes — `auto` / `new` / `text` / `code`. `auto` prefers the
  dedicated AED and OMR signs and deliberately keeps the safe text symbol
  (`ر.س`) for SAR.
- `spellCurrency()` — cheque-grade تفقيط with correct singular, dual, plural
  and accusative agreement, optional «فقط لا غير» suffix, noun paradigms
  bundled for every Arab currency.
- `getCurrencyInfo()`, `resolveCurrencySymbol()`, `currencyForRegion()`,
  `currencyForLocale()`.

### Numbers — `arabicfmt/number`

- `arabicToWords()` (gender-aware, all scales), `arabicOrdinal()`,
  `arabicFraction()` and `countedNoun()` — العدد والمعدود applied
  automatically.
- `formatNumber()`, `formatPercent()`, `formatCompact()`, `formatDuration()`,
  `formatFileSize()`, `formatRelativeTime()`.
- `parseNumber()` / `parseCurrency()` — Eastern Arabic digits, Arabic decimal
  (٫) and thousands (٬) separators, accounting parentheses; plus
  `toArabicDigits()` / `toLatinDigits()`.

### Dates — `arabicfmt/umalqura` and `arabicfmt/date`

- Frozen official Umm al-Qura tables (AH 1300–1599) — deterministic Hijri
  conversion, identical on Node, Chrome, Safari and Hermes: `toHijri()`,
  `fromHijri()`, `formatHijri()`.
- Lightweight tabular Hijri core in `arabicfmt/date` for minimal bundles.

### Text — `arabicfmt/text`

- The full six-form CLDR plural system: `arabicPlural()`,
  `arabicPluralForm()`.
- Normalization: `stripTashkeel()`, `removeTatweel()`, `normalizeArabic()`,
  `normalizeForSearch()` and friends; `transliterate()` and `slugify()`.
- Arabic collation — `compareArabic()`, `sortArabic()`,
  `createArabicCollator()` — and `formatList()`.

### Bidi — `arabicfmt/bidi`

- `isolateForeign()` wraps every LTR run in FSI…PDI so phone numbers and
  Latin words stop scrambling Arabic sentences; direction detection,
  isolate/wrap/strip helpers and the raw control characters.

### Validation — `arabicfmt/validate`

- `isValidIBAN()` / `formatIBAN()` / `normalizeIBAN()` (ISO 7064 mod-97) and
  `isValidSaudiId()` / `saudiIdType()` (Luhn, citizen vs resident).

### Engineering

- Zero runtime dependencies; dual ESM + CJS with full TypeScript types;
  tree-shakeable subpath exports (`arabicfmt/currency`, `/number`, `/date`,
  `/umalqura`, `/bidi`, `/text`, `/validate`); about 11 kB min+gzip for the
  entire library.
- 194 tests. Currency data generated from CLDR 48.2.0 and re-verified on
  every build. Node ≥ 18, evergreen browsers, React Native / Hermes, Deno,
  Bun.
- Interactive demo (`demo/`) rendered live by the library source, deployable
  to Vercel via the root `vercel.json`.
