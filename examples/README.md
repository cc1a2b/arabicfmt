# arabicfmt examples

Runnable, heavily-commented examples for every [arabicfmt](https://www.npmjs.com/package/arabicfmt) feature. Each file is plain ESM (`.mjs`), imports only the real public API, and `console.log`s clearly labeled outputs with the expected result inline as comments.

## Running

```bash
cd examples
npm install        # installs arabicfmt ^0.1.2 from npm
node currency.mjs  # or any file below
```

You can also use the npm scripts:

```bash
npm run currency   # node currency.mjs
npm run all        # runs every example in sequence
```

> Output is Arabic (RTL). For correct display use a UTF-8 terminal with an Arabic-capable font.

## Examples

| File | Subpath import | Demonstrates |
| --- | --- | --- |
| [`currency.mjs`](./currency.mjs) | `arabicfmt/currency` | `formatCurrency`, `getCurrencyInfo`, `resolveCurrencySymbol`, `currencyDigits`, `currencyForLocale`, `currencyForRegion`, `countryCurrency`, `spellCurrency`, `getSymbolData`, `CURRENCY_SYMBOLS`, `CURRENCY_WORDS`, `ARAB_LEAGUE_COUNTRIES` |
| [`numbers.mjs`](./numbers.mjs) | `arabicfmt/number` | `formatNumber`, `formatCompact`, `formatPercent`, `parseNumber`, `parseCurrency`, `toArabicDigits`, `toLatinDigits`, `ARABIC_INDIC_DIGITS`, `EXTENDED_ARABIC_INDIC_DIGITS` |
| [`words.mjs`](./words.mjs) | `arabicfmt/number` | `arabicToWords`, `arabicOrdinal`, `arabicFraction`, `countedNoun` |
| [`dates.mjs`](./dates.mjs) | `arabicfmt/date`, `arabicfmt/umalqura` | `formatHijri`, `toHijri`, `fromHijri`, `formatHijriDate`, Umm al-Qura conversions, month/era tables |
| [`text.mjs`](./text.mjs) | `arabicfmt/text` | `normalizeArabic`, `stripTashkeel`, `removeTatweel`, `normalizeForSearch`, `arabicPluralForm`, `arabicPlural`, `sortArabic`, `compareArabic`, `formatList`, `slugify`, `transliterate` |
| [`bidi.mjs`](./bidi.mjs) | `arabicfmt/bidi` | `charDirection`, `detectDirection`, `isRTL`, `isolate`, `wrapLTR`, `wrapRTL`, `stripBidi`, `isolateForeign`, control constants (`LRI`/`RLI`/`FSI`/`PDI`/`LRM`/`RLM`/`ALM`) |
| [`validate.mjs`](./validate.mjs) | `arabicfmt/validate` | `isValidIBAN`, `formatIBAN`, `normalizeIBAN`, `IBAN_LENGTHS`, `isValidSaudiId`, `saudiIdType` |
