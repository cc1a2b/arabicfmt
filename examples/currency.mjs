// currency.mjs — arabicfmt currency formatting & metadata
//
// All currency helpers live in the "arabicfmt/currency" subpath export.
// Run with:  node currency.mjs
import {
  formatCurrency,
  formatCurrencyRange,
  formatCurrencyToParts,
  getCurrencyInfo,
  resolveCurrencySymbol,
  currencyDigits,
  currencyForLocale,
  currencyForRegion,
  countryCurrency,
  spellCurrency,
  getSymbolData,
  listCurrencyTransitions,
  signFontFaceCSS,
  transitionStatus,
  CURRENCY_SYMBOLS,
  CURRENCY_WORDS,
  ARAB_LEAGUE_COUNTRIES,
} from 'arabicfmt/currency';

console.log('=== formatCurrency ===');
// Format a money amount with the correct symbol and minor-unit digits.
console.log(formatCurrency(1234.5, { currency: 'SAR' }));
// → 1,234.50 ر.س
console.log(formatCurrency(1234.5, { currency: 'KWD' })); // KWD has 3 minor digits
// → 1,234.500 د.ك
console.log(formatCurrency(1234.5, { currency: 'AED' })); // AED auto-symbol = new U+20C3 glyph
// → 1,234.50 ⃃

console.log('\n=== getCurrencyInfo ===');
// Rich metadata: minor digits, symbol variants, Unicode transition info, display name.
console.log(getCurrencyInfo('SAR', 'ar'));
// → { code: 'SAR', digits: 2, symbols: { auto: 'ر.س', text: 'ر.س', code: 'SAR', new: '⃁' },
//     unicode: { codepoint: 'U+20C1', ... }, displayName: 'ريال سعودي' }

console.log('\n=== resolveCurrencySymbol ===');
// Pick which symbol form to render. mode: 'auto' | 'text' | 'code' | 'new'.
console.log(resolveCurrencySymbol('SAR', { mode: 'auto' }));
// → ر.س
console.log(resolveCurrencySymbol('SAR', { mode: 'new' })); // the new U+20C1 glyph
// → ⃁

console.log('\n=== currencyDigits ===');
// Number of minor-unit (fraction) digits a currency uses.
console.log(currencyDigits('KWD')); // → 3
console.log(currencyDigits('SAR')); // → 2

console.log('\n=== currencyForLocale / currencyForRegion / countryCurrency ===');
console.log(currencyForLocale('ar-SA')); // → SAR
console.log(currencyForRegion('SA'));    // → SAR
console.log(countryCurrency('SA'));      // → SAR
console.log(countryCurrency('AE'));      // → AED

console.log('\n=== spellCurrency ===');
// Spell a money amount out in full Arabic words (major + minor units).
console.log(spellCurrency(1234.5, { currency: 'SAR' }));
// → ألف ومئتان وأربعة وثلاثون ريالاً وخمسون هللةً

console.log('\n=== getSymbolData / CURRENCY_SYMBOLS ===');
console.log(getSymbolData('SAR'));
// → { code: 'SAR', text: 'ر.س', unicode: { char: '⃁', codepoint: 'U+20C1', ... } }
console.log(CURRENCY_SYMBOLS['AED'].text); // → د.إ

console.log('\n=== CURRENCY_WORDS ===');
// Grammatical word forms used when spelling currency amounts.
console.log(CURRENCY_WORDS['SAR']);
// → { major: { gender: 'male', singular: 'ريال', ... }, minor: { ... } }

console.log('\n=== formatCurrencyRange ===');
// A price range shares one symbol and one precision.
console.log(formatCurrencyRange(1000, 5000, { currency: 'SAR' }));
// → 1,000.00 – 5,000.00 ر.س
console.log(formatCurrencyRange(1.2, 2, { currency: 'KWD' }));
// → 1.200 – 2.000 د.ك

console.log('\n=== formatCurrencyToParts ===');
// Typed parts, so a UI can style just the symbol. needsFont marks a brand-new
// Unicode sign that most system fonts still cannot draw.
console.log(formatCurrencyToParts(1234.5, { currency: 'SAR', symbolMode: 'new' }));
// → [ ..., { type: 'currency', value: '⃁', symbolMode: 'new', codepoint: 'U+20C1', needsFont: true } ]

console.log('\n=== the Unicode currency-sign transition ===');
// Status is evaluated at a moment in time: none -> announced -> encoded.
console.log(transitionStatus('SAR'));                            // → encoded
console.log(transitionStatus('AED', new Date('2026-01-01')));     // → announced
console.log(transitionStatus('KWD'));                            // → none (Kuwait has no sign)
console.log(listCurrencyTransitions({ unicodeVersion: '18.0' }).map((t) => t.code));
// → [ 'MVR', 'AED', 'OMR' ]

console.log('\n=== signFontFaceCSS ===');
// The scoped @font-face that makes the new signs render, downloading the font
// only on pages that actually paint one of those codepoints.
console.log(signFontFaceCSS({ src: '/fonts/currency-signs.woff2' }));

console.log('\n=== ARAB_LEAGUE_COUNTRIES ===');
// All 22 Arab League members with English + Arabic names.
console.log(ARAB_LEAGUE_COUNTRIES[0]);
// → { region: 'SA', nameEn: 'Saudi Arabia', nameAr: 'السعودية' }
console.log('total countries:', ARAB_LEAGUE_COUNTRIES.length); // → 22
