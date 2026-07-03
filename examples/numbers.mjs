// numbers.mjs — arabicfmt number formatting, parsing & digit conversion
//
// All helpers live in the "arabicfmt/number" subpath export.
// Run with:  node numbers.mjs
import {
  formatNumber,
  formatCompact,
  formatPercent,
  parseNumber,
  parseCurrency,
  toArabicDigits,
  toLatinDigits,
  ARABIC_INDIC_DIGITS,
  EXTENDED_ARABIC_INDIC_DIGITS,
} from 'arabicfmt/number';

console.log('=== formatNumber ===');
// Group + format a number. numerals: 'latn' (default) or 'arab' (Eastern Arabic-Indic).
console.log(formatNumber(1234567.89, { numerals: 'arab' }));
// → ١٬٢٣٤٬٥٦٧٫٨٩
console.log(formatNumber(1234567.89));
// → 1,234,567.89

console.log('\n=== formatCompact ===');
// Compact notation ("1.2 million") localized to Arabic.
console.log(formatCompact(1_200_000, { locale: 'ar' }));
// → 1.2 مليون
console.log(formatCompact(1_200_000, { locale: 'ar', numerals: 'arab' }));
// → ١٫٢ مليون

console.log('\n=== formatPercent ===');
// 0.42 → "42%". Input is a ratio (0..1).
// Note: the result is wrapped in invisible bidi marks so the % renders correctly in RTL.
console.log(formatPercent(0.42));
// → 42%
console.log(formatPercent(0.42, { numerals: 'arab' }));
// → ٤٢٪

console.log('\n=== toArabicDigits / toLatinDigits ===');
// Convert ASCII digits to Eastern Arabic-Indic and back.
console.log(toArabicDigits('1234')); // → ١٢٣٤
console.log(toLatinDigits('١٢٣٤'));  // → 1234

console.log('\n=== parseNumber / parseCurrency ===');
// Parse Arabic-formatted strings (Arabic-Indic digits + Arabic separators) back to JS numbers.
console.log(parseNumber('١٬٢٣٤٫٥٦'));       // → 1234.56
console.log(parseCurrency('١٬٢٣٤٫٥٠٠ د.ك')); // → 1234.5

console.log('\n=== digit tables ===');
// Index 0..9 of each digit set.
console.log(ARABIC_INDIC_DIGITS[1]);          // → ١
console.log(EXTENDED_ARABIC_INDIC_DIGITS[1]); // → ۱  (Persian/Urdu form)
console.log(ARABIC_INDIC_DIGITS.join(''));    // → ٠١٢٣٤٥٦٧٨٩
