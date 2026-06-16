// validate.mjs — arabicfmt IBAN & Saudi national ID validation
//
// All helpers live in the "arabicfmt/validate" subpath export.
// Run with:  node validate.mjs
import {
  isValidIBAN,
  formatIBAN,
  normalizeIBAN,
  IBAN_LENGTHS,
  isValidSaudiId,
  saudiIdType,
} from 'arabicfmt/validate';

console.log('=== IBAN ===');
// Validate (mod-97 checksum + per-country length).
console.log(isValidIBAN('SA03 8000 0000 6080 1016 7519')); // → true
console.log(isValidIBAN('SA03 8000 0000 6080 1016 7510')); // → false (bad checksum)

// Strip spaces / uppercase.
console.log(normalizeIBAN('SA03 8000 0000 6080 1016 7519'));
// → SA0380000000608010167519

// Re-group into 4-character blocks for display.
console.log(formatIBAN('SA0380000000608010167519'));
// → SA03 8000 0000 6080 1016 7519

// Expected total length per country code.
console.log('SA length:', IBAN_LENGTHS['SA']); // → 24
console.log('AE length:', IBAN_LENGTHS['AE']); // → 23

console.log('\n=== Saudi national ID ===');
// Validate a 10-digit Saudi ID (Luhn-style check).
console.log(isValidSaudiId('1012345672')); // → true
// saudiIdType: 'citizen' (starts with 1) | 'resident' (starts with 2) | null
console.log(saudiIdType('1012345672'));    // → citizen
// Returns null when the ID fails the checksum (a leading 2 alone is not enough).
console.log(saudiIdType('2012345674'));    // → null
