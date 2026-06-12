/**
 * Romanize Arabic script into readable Latin text, and turn it into URL slugs.
 *
 * This is a deterministic, pragmatic scheme (not a strict academic
 * transliteration): consonants and short vowels map to their common Latin
 * equivalents, shadda doubles the preceding consonant, and Arabic-Indic digits
 * become Western digits. Short vowels only appear when the input is vowelled
 * (carries tashkeel) — bare text romanizes consonant-only, e.g. "محمد" → "mhmd",
 * while "مُحَمَّد" → "muhammad".
 */

import { toLatinDigits } from "../number/numerals";

const cc = String.fromCharCode;

// Letters (consonants + long vowels + hamza carriers).
const LETTERS: Record<string, string> = {
  [cc(0x0627)]: "a", // ا
  [cc(0x0623)]: "a", // أ
  [cc(0x0625)]: "i", // إ
  [cc(0x0622)]: "aa", // آ
  [cc(0x0671)]: "a", // ٱ
  [cc(0x0628)]: "b", // ب
  [cc(0x062a)]: "t", // ت
  [cc(0x062b)]: "th", // ث
  [cc(0x062c)]: "j", // ج
  [cc(0x062d)]: "h", // ح
  [cc(0x062e)]: "kh", // خ
  [cc(0x062f)]: "d", // د
  [cc(0x0630)]: "dh", // ذ
  [cc(0x0631)]: "r", // ر
  [cc(0x0632)]: "z", // ز
  [cc(0x0633)]: "s", // س
  [cc(0x0634)]: "sh", // ش
  [cc(0x0635)]: "s", // ص
  [cc(0x0636)]: "d", // ض
  [cc(0x0637)]: "t", // ط
  [cc(0x0638)]: "z", // ظ
  [cc(0x0639)]: "'", // ع
  [cc(0x063a)]: "gh", // غ
  [cc(0x0641)]: "f", // ف
  [cc(0x0642)]: "q", // ق
  [cc(0x0643)]: "k", // ك
  [cc(0x0644)]: "l", // ل
  [cc(0x0645)]: "m", // م
  [cc(0x0646)]: "n", // ن
  [cc(0x0647)]: "h", // ه
  [cc(0x0648)]: "w", // و
  [cc(0x064a)]: "y", // ي
  [cc(0x0649)]: "a", // ى alef maksura
  [cc(0x0629)]: "h", // ة taa marbuta
  [cc(0x0621)]: "'", // ء hamza
  [cc(0x0624)]: "w", // ؤ
  [cc(0x0626)]: "y", // ئ
};

// Short-vowel and nunation marks.
const HARAKAT: Record<string, string> = {
  [cc(0x064e)]: "a", // fatha
  [cc(0x064f)]: "u", // damma
  [cc(0x0650)]: "i", // kasra
  [cc(0x064b)]: "an", // fathatan
  [cc(0x064c)]: "un", // dammatan
  [cc(0x064d)]: "in", // kasratan
  [cc(0x0652)]: "", // sukun
};

const SHADDA = cc(0x0651); // ّ — doubles the preceding consonant
const TATWEEL = cc(0x0640); // ـ — elongation, dropped

/**
 * Romanize Arabic script to Latin text.
 *
 * @example transliterate("مُحَمَّد")     // "muhammad"
 * @example transliterate("القاهرة")     // "alqahrh"
 * @example transliterate("غرفة ٢٠١")    // "ghrfh 201"
 */
export function transliterate(text: string): string {
  // Canonicalize "<vowel><shadda>" → "<shadda><vowel>" so the doubling attaches
  // to the consonant, not after the vowel (مُحَمَّد → "muhammad", not "muhamamd").
  const normalized = toLatinDigits(text).replace(
    /([ًٌٍَُِْ])ّ/g,
    `ّ$1`,
  );
  let out = "";
  let lastLetter = "";

  for (const ch of normalized) {
    if (ch === TATWEEL) continue;
    if (ch === SHADDA) {
      out += lastLetter; // double the previous consonant
      continue;
    }
    const letter = LETTERS[ch];
    if (letter !== undefined) {
      out += letter;
      lastLetter = letter;
      continue;
    }
    const haraka = HARAKAT[ch];
    if (haraka !== undefined) {
      out += haraka;
      continue;
    }
    out += ch; // spaces, Latin, punctuation, digits pass through
  }

  return out;
}

export interface SlugifyOptions {
  /** Word separator. Default `"-"`. */
  separator?: string;
  /** Lower-case the result. Default `true`. */
  lowercase?: boolean;
}

/**
 * Turn Arabic (or mixed) text into a URL-safe slug.
 *
 * @example slugify("مدينة نصر")              // "mdynh-nsr"
 * @example slugify("القاهرة 2026")           // "alqahrh-2026"
 * @example slugify("Hello العالم", { separator: "_" }) // "hello_alaalm"
 */
export function slugify(text: string, options: SlugifyOptions = {}): string {
  const separator = options.separator ?? "-";
  const lowercase = options.lowercase ?? true;

  let s = transliterate(text);
  if (lowercase) s = s.toLowerCase();

  // Drop the apostrophes produced for ع / ء, then collapse the rest to seps.
  const sep = separator.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // escape for regex
  return s
    .replace(/['']/g, "")
    .replace(/[^a-zA-Z0-9]+/g, separator)
    .replace(new RegExp(`${sep}{2,}`, "g"), separator)
    .replace(new RegExp(`^${sep}|${sep}$`, "g"), "");
}
