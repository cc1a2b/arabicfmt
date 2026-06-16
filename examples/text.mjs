// text.mjs — arabicfmt text normalization, plurals, sorting, lists, transliteration
//
// All helpers live in the "arabicfmt/text" subpath export.
// Run with:  node text.mjs
import {
  normalizeArabic,
  normalizeForSearch,
  stripTashkeel,
  removeTatweel,
  arabicPluralForm,
  arabicPlural,
  sortArabic,
  compareArabic,
  formatList,
  slugify,
  transliterate,
} from 'arabicfmt/text';

console.log('=== normalize ===');
// Strip diacritics / unify letter forms for clean comparison & search.
console.log(normalizeArabic('مُحَمَّد'));        // → محمد
console.log(stripTashkeel('مُحَمَّد'));          // → محمد
console.log(removeTatweel('محـــمد'));           // → محمد
console.log(normalizeForSearch('مُحَمَّد'));     // → محمد

console.log('\n=== plural ===');
// Arabic has 6 plural categories. arabicPluralForm picks the CLDR category;
// arabicPlural returns the matching word form.
console.log(arabicPluralForm(5)); // → few
console.log(arabicPluralForm(1)); // → one
const book = { one: 'كتاب', two: 'كتابان', few: 'كتب', many: 'كتاباً', other: 'كتاب' };
console.log(arabicPlural(1, book)); // → كتاب
console.log(arabicPlural(2, book)); // → كتابان
console.log(arabicPlural(5, book)); // → كتب

console.log('\n=== sort ===');
// Locale-correct Arabic ordering.
console.log(sortArabic(['ياسر', 'أحمد', 'بسام']));
// → [ 'أحمد', 'بسام', 'ياسر' ]
console.log(['ب', 'أ', 'ت'].sort(compareArabic));
// → [ 'أ', 'ب', 'ت' ]

console.log('\n=== list ===');
// Join items with the correct Arabic conjunction.
console.log(formatList(['أحمد', 'محمد', 'علي']));
// → أحمد ومحمد وعلي

console.log('\n=== slugify / transliterate ===');
// URL-safe slug and Latin transliteration of Arabic text.
console.log(slugify('مدينة نصر'));       // → mdynh-nsr
console.log(transliterate('مُحَمَّد'));   // → muhammad
