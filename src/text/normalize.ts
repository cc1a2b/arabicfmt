import { toLatinDigits } from "../number/numerals";

// All ranges are built from codepoints (combining marks are invisible).
const cc = String.fromCharCode;
const ALEF = cc(0x0627); // ا
const YAA = cc(0x064a); // ي
const HAA = cc(0x0647); // ه
const WAW = cc(0x0648); // و

// Harakat, hamza-above/below, superscript alef and Quranic annotation marks.
const TASHKEEL = new RegExp(
  `[${cc(0x0610)}-${cc(0x061a)}${cc(0x064b)}-${cc(0x065f)}${cc(0x0670)}${cc(0x06d6)}-${cc(0x06dc)}${cc(0x06df)}-${cc(0x06e8)}${cc(0x06ea)}-${cc(0x06ed)}]`,
  "g",
);
const TATWEEL = new RegExp(cc(0x0640), "g"); // ـ kashida
const ALEF_VARIANTS = new RegExp(
  `[${cc(0x0622)}${cc(0x0623)}${cc(0x0625)}${cc(0x0671)}]`,
  "g",
); // آ أ إ ٱ
const TAA_MARBUTA = new RegExp(cc(0x0629), "g"); // ة
const ALEF_MAKSURA = new RegExp(cc(0x0649), "g"); // ى
const HAMZA_ON_WAW = new RegExp(cc(0x0624), "g"); // ؤ
const HAMZA_ON_YAA = new RegExp(cc(0x0626), "g"); // ئ
const STANDALONE_HAMZA = new RegExp(cc(0x0621), "g"); // ء

/** Remove Arabic diacritics (tashkeel / harakat). */
export function stripTashkeel(text: string): string {
  return text.replace(TASHKEEL, "");
}

/** Remove the tatweel / kashida elongation character (ـ). */
export function removeTatweel(text: string): string {
  return text.replace(TATWEEL, "");
}

/** Unify alef variants (آ أ إ ٱ) to a bare alef (ا). */
export function normalizeAlef(text: string): string {
  return text.replace(ALEF_VARIANTS, ALEF);
}

/** Convert alef maksura (ى) to yaa (ي). */
export function normalizeAlefMaksura(text: string): string {
  return text.replace(ALEF_MAKSURA, YAA);
}

/** Convert taa marbuta (ة) to haa (ه). Changes meaning — use for search only. */
export function normalizeTaaMarbuta(text: string): string {
  return text.replace(TAA_MARBUTA, HAA);
}

export interface NormalizeOptions {
  /** Strip diacritics. Default `true`. */
  tashkeel?: boolean;
  /** Remove tatweel / kashida. Default `true`. */
  tatweel?: boolean;
  /** Unify alef variants to ا. Default `true`. */
  alef?: boolean;
  /** Convert alef maksura ى to ي. Default `true`. */
  alefMaksura?: boolean;
  /** Convert taa marbuta ة to ه. Default `false`. */
  taaMarbuta?: boolean;
  /** Fold hamza carriers (ؤ→و, ئ→ي) and drop standalone ء. Default `false`. */
  hamza?: boolean;
  /** Convert Arabic-Indic digits to Western. Default `false`. */
  digits?: boolean;
}

/**
 * Normalize Arabic text for search and comparison. By default it strips
 * diacritics and tatweel and unifies alef and alef-maksura — the safe set that
 * doesn't change a word's identity. Enable {@link NormalizeOptions.taaMarbuta}
 * and {@link NormalizeOptions.hamza} for more aggressive folding.
 */
export function normalizeArabic(
  text: string,
  options: NormalizeOptions = {},
): string {
  let out = text;
  if (options.tatweel ?? true) out = removeTatweel(out);
  if (options.tashkeel ?? true) out = stripTashkeel(out);
  if (options.alef ?? true) out = normalizeAlef(out);
  if (options.alefMaksura ?? true) out = normalizeAlefMaksura(out);
  if (options.taaMarbuta ?? false) out = normalizeTaaMarbuta(out);
  if (options.hamza ?? false) {
    out = out
      .replace(HAMZA_ON_WAW, WAW)
      .replace(HAMZA_ON_YAA, YAA)
      .replace(STANDALONE_HAMZA, "");
  }
  if (options.digits ?? false) out = toLatinDigits(out);
  return out;
}

/**
 * Aggressive normalization preset for building search keys: applies every fold
 * (including taa marbuta and hamza), converts digits, lower-cases embedded Latin
 * text and collapses whitespace.
 */
export function normalizeForSearch(text: string): string {
  return normalizeArabic(text, {
    taaMarbuta: true,
    hamza: true,
    digits: true,
  })
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}
