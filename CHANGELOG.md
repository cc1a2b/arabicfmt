# Changelog

All notable changes to this project are documented here. The format follows
[Keep a Changelog](https://keepachangelog.com/), and the project adheres to
[Semantic Versioning](https://semver.org/).

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
