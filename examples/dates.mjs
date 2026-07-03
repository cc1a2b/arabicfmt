// dates.mjs — arabicfmt Hijri date conversion & formatting
//
// Tabular/astronomical Hijri lives in "arabicfmt/date".
// Official Umm al-Qura calendar lives in "arabicfmt/umalqura".
// Run with:  node dates.mjs
import {
  formatHijri,
  toHijri,
  fromHijri,
  formatHijriDate,
  HIJRI_MONTHS_AR,
  HIJRI_ERA_AR,
} from 'arabicfmt/date';
import {
  gregorianToUmalqura,
  umalquraToGregorian,
  isUmalquraYear,
  UMALQURA_FIRST_YEAR,
  UMALQURA_LAST_YEAR,
} from 'arabicfmt/umalqura';

const g = new Date('2025-09-23'); // a Gregorian date (UTC midnight)

console.log('=== formatHijri ===');
// Format a Gregorian Date as a Hijri string (tabular calendar).
console.log(formatHijri(g, { numerals: 'arab' }));
// → ٣٠ ربيع الأول ١٤٤٧ هـ
console.log(formatHijri(g));
// → 30 ربيع الأول 1447 هـ

console.log('\n=== toHijri ===');
// Convert a Gregorian Date to {year, month, day} (tabular).
console.log(toHijri(g));
// → { year: 1447, month: 3, day: 30 }

console.log('\n=== fromHijri ===');
// Convert a Hijri y/m/d back to a Gregorian Date (UTC midnight). Round-trips with toHijri.
console.log(fromHijri(1447, 3, 30).toISOString());
// → 2025-09-23T00:00:00.000Z

console.log('\n=== formatHijriDate ===');
// Format an already-computed HijriDate object (month 9 = رمضان).
console.log(formatHijriDate({ year: 1447, month: 9, day: 23 }, { locale: 'ar' }));
// → 23 رمضان 1447 هـ

console.log('\n=== month/era tables ===');
console.log(HIJRI_MONTHS_AR[0]); // → محرّم
console.log(HIJRI_ERA_AR);       // → هـ

console.log('\n=== Umm al-Qura (official Saudi calendar) ===');
// Umm al-Qura is the official astronomical calendar and can differ from the tabular one.
console.log(gregorianToUmalqura(g));
// → { year: 1447, month: 4, day: 1 }
console.log(umalquraToGregorian(1447, 4, 1).toISOString());
// → 2025-09-23T00:00:00.000Z
console.log('isUmalquraYear(1447):', isUmalquraYear(1447)); // → true
console.log('supported range:', UMALQURA_FIRST_YEAR, '–', UMALQURA_LAST_YEAR);
// → 1300 – 1599
