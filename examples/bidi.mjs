// bidi.mjs — arabicfmt bidirectional-text helpers
//
// All helpers live in the "arabicfmt/bidi" subpath export.
// These functions insert INVISIBLE Unicode control characters (isolates / marks)
// so that mixed LTR/RTL strings render correctly. Because the controls are
// invisible, we also print code points so you can see what was inserted.
// Run with:  node bidi.mjs
import {
  charDirection,
  detectDirection,
  isRTL,
  isolate,
  wrapLTR,
  wrapRTL,
  stripBidi,
  isolateForeign,
  LRI,
  RLI,
  FSI,
  PDI,
  LRM,
  RLM,
  ALM,
} from 'arabicfmt/bidi';

// Helper: render a string's code points so invisible controls are visible.
const cp = (s) => [...s].map((c) => 'U+' + c.codePointAt(0).toString(16).toUpperCase().padStart(4, '0')).join(' ');

console.log('=== charDirection / detectDirection / isRTL ===');
console.log(charDirection('ا'));               // → rtl
console.log(charDirection('A'));               // → ltr
console.log(detectDirection('السلام عليكم'));  // → rtl
console.log(isRTL('السلام'));                  // → true
console.log(isRTL('hello'));                   // → false

console.log('\n=== isolate / wrapLTR / wrapRTL ===');
// isolate('hello') wraps text in FSI…PDI (auto direction) by default.
console.log('isolate:', cp(isolate('hello')));
// → U+2068 U+0068 U+0065 U+006C U+006C U+006F U+2069   (FSI hello PDI)
console.log('wrapLTR:', cp(wrapLTR('hello')));
// → U+2066 U+0068 U+0065 U+006C U+006C U+006F U+2069   (LRI hello PDI)
console.log('wrapRTL:', cp(wrapRTL('سلام')));
// → U+2067 ... U+2069   (RLI ... PDI)

console.log('\n=== stripBidi ===');
// Remove all bidi control characters again.
const wrapped = wrapRTL('السلام');
console.log('before:', cp(wrapped));
console.log('after :', stripBidi(wrapped), '/', cp(stripBidi(wrapped)));
// → السلام  (controls removed)

console.log('\n=== isolateForeign ===');
// Auto-wrap foreign / LTR runs (phone numbers, latin words) embedded in Arabic.
const phone = isolateForeign('اتصل على +1 (555) 234-5678 الآن');
console.log(phone);
// → اتصل على ⁦+1 (555) 234-5678⁩ الآن  (LTR run isolated)
console.log('contains LRI:', phone.includes(LRI), '| contains PDI:', phone.includes(PDI));
// → true | true

console.log('\n=== raw control constants ===');
// The individual Unicode formatting characters, exported for manual use.
console.log('LRI', cp(LRI), '| RLI', cp(RLI), '| FSI', cp(FSI), '| PDI', cp(PDI));
// → LRI U+2066 | RLI U+2067 | FSI U+2068 | PDI U+2069
console.log('LRM', cp(LRM), '| RLM', cp(RLM), '| ALM', cp(ALM));
// → LRM U+200E | RLM U+200F | ALM U+061C
