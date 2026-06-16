// words.mjs — arabicfmt spelling numbers in Arabic words
//
// All helpers live in the "arabicfmt/number" subpath export.
// Run with:  node words.mjs
import {
  arabicToWords,
  arabicOrdinal,
  arabicFraction,
  countedNoun,
} from 'arabicfmt/number';

console.log('=== arabicToWords ===');
// Spell a cardinal number in full Arabic words.
console.log(arabicToWords(1234567));
// → مليون ومئتان وأربعة وثلاثون ألفاً وخمسمئة وسبعة وستون
console.log(arabicToWords(42));
// → اثنان وأربعون

console.log('\n=== arabicOrdinal ===');
// Ordinal form ("the 25th").
console.log(arabicOrdinal(25));
// → الخامس والعشرون
console.log(arabicOrdinal(1));
// → الأول

console.log('\n=== arabicFraction ===');
// Spell a fraction numerator/denominator in Arabic.
console.log(arabicFraction(3, 4));
// → ثلاثة أرباع
console.log(arabicFraction(1, 2));
// → نصف

console.log('\n=== countedNoun ===');
// Apply correct Arabic grammatical agreement (counted-noun rules) to a noun.
// The noun object provides gender + singular/dual/plural/accusative forms.
const riyal = {
  gender: 'male',
  singular: 'ريال',
  dual: 'ريالان',
  plural: 'ريالات',
  accusative: 'ريالاً',
};
console.log(countedNoun(1, riyal));  // → ريال واحد
console.log(countedNoun(2, riyal));  // → ريالان
console.log(countedNoun(3, riyal));  // → ثلاثة ريالات
console.log(countedNoun(11, riyal)); // → أحد عشر ريالاً
