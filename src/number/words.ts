/**
 * Convert an integer to its Arabic word representation.
 *
 * Arabic number words follow strict grammar rules:
 *   - Ones 3–9 use gender polarity (opposite gender to the counted noun).
 *   - Teens 11–19 are compound; 10/11/12 have special forms.
 *   - Scale words (thousands, millions…) use singular (1), dual (2),
 *     plural (3–10), or tanwin-singular (11–99) forms.
 */

// --- data tables -----------------------------------------------------------

const ONES_M = [
  "",
  "واحد",
  "اثنان",
  "ثلاثة",
  "أربعة",
  "خمسة",
  "ستة",
  "سبعة",
  "ثمانية",
  "تسعة",
] as const;

const ONES_F = [
  "",
  "واحدة",
  "اثنتان",
  "ثلاث",
  "أربع",
  "خمس",
  "ست",
  "سبع",
  "ثماني",
  "تسع",
] as const;

// Index = value − 10 (index 0 → 10, index 1 → 11 …)
const TEENS_M = [
  "عشرة",
  "أحد عشر",
  "اثنا عشر",
  "ثلاثة عشر",
  "أربعة عشر",
  "خمسة عشر",
  "ستة عشر",
  "سبعة عشر",
  "ثمانية عشر",
  "تسعة عشر",
] as const;

const TEENS_F = [
  "عشر",
  "إحدى عشرة",
  "اثنتا عشرة",
  "ثلاث عشرة",
  "أربع عشرة",
  "خمس عشرة",
  "ست عشرة",
  "سبع عشرة",
  "ثماني عشرة",
  "تسع عشرة",
] as const;

// Index = tens digit (index 2 → 20 …)
const TENS = [
  "",
  "عشرة",
  "عشرون",
  "ثلاثون",
  "أربعون",
  "خمسون",
  "ستون",
  "سبعون",
  "ثمانون",
  "تسعون",
] as const;

// Index = hundreds digit
const HUNDREDS = [
  "",
  "مئة",
  "مئتان",
  "ثلاثمئة",
  "أربعمئة",
  "خمسمئة",
  "ستمئة",
  "سبعمئة",
  "ثمانمئة",
  "تسعمئة",
] as const;

interface ScaleWord {
  /** Used when count = 1 (no number prefix). E.g. "ألف". */
  one: string;
  /** Used when count = 2 (dual, no number prefix). E.g. "ألفان". */
  two: string;
  /** Plural form used with count 3–10. E.g. "آلاف". */
  plural: string;
  /** Tanwin-singular used with count 11–99. E.g. "ألفاً". */
  tanwin: string;
}

// Scale words for powers of 1000 (index 1 = thousands, 2 = millions …)
const SCALES: ScaleWord[] = [
  { one: "", two: "", plural: "", tanwin: "" }, // placeholder for index 0
  { one: "ألف", two: "ألفان", plural: "آلاف", tanwin: "ألفاً" },
  { one: "مليون", two: "مليونان", plural: "ملايين", tanwin: "مليوناً" },
  { one: "مليار", two: "ملياران", plural: "مليارات", tanwin: "ملياراً" },
  { one: "تريليون", two: "تريليونان", plural: "تريليونات", tanwin: "تريليوناً" },
];

// --- core helpers ----------------------------------------------------------

type Gender = "male" | "female";

function under1000(n: number, gender: Gender): string {
  if (n <= 0) return "";

  const h = Math.floor(n / 100);
  const rem = n % 100;
  const parts: string[] = [];

  if (h > 0) parts.push(HUNDREDS[h] as string);

  if (rem === 0) {
    // hundreds only — already pushed
  } else if (rem < 10) {
    parts.push((gender === "male" ? ONES_M : ONES_F)[rem] as string);
  } else if (rem < 20) {
    parts.push((gender === "male" ? TEENS_M : TEENS_F)[rem - 10] as string);
  } else {
    const t = Math.floor(rem / 10);
    const u = rem % 10;
    if (u === 0) {
      parts.push(TENS[t] as string);
    } else {
      // Arabic order: unit + "و" + tens (e.g. "خمسة وعشرون").
      // Feminine "one" in a tens-compound is "إحدى" (إحدى وعشرون), not "واحدة".
      const unit =
        gender === "female" && u === 1
          ? "إحدى"
          : ((gender === "male" ? ONES_M : ONES_F)[u] as string);
      parts.push(`${unit} و${TENS[t]}`);
    }
  }

  return parts.join(" و");
}

function scaleGroup(count: number, scale: ScaleWord): string {
  if (count === 1) return scale.one;
  if (count === 2) return scale.two;

  // Scale counts (3+) always use masculine gender because آلاف/ملايين are masculine.
  const countWord = under1000(count, "male");
  const mod100 = count % 100;

  if (mod100 >= 3 && mod100 <= 10) return `${countWord} ${scale.plural}`;
  if (mod100 >= 11 && mod100 <= 99) return `${countWord} ${scale.tanwin}`;
  // 100, 200 … → singular scale word  (مئة ألف, مئتان ألف …)
  return `${countWord} ${scale.one}`;
}

// --- public API ------------------------------------------------------------

export interface ArabicWordsOptions {
  /**
   * Grammatical gender of the counted noun. Affects ones (1–2) and the
   * final group (3–9). Default `"male"`.
   *
   * Use `"male"` for masculine nouns (ريال، دينار…) and most standalone
   * numbers. Use `"female"` for feminine nouns (ليرة، روبية…).
   */
  gender?: Gender;
  /** Prepend "سالب" for negative values. Default `true`. */
  negative?: boolean;
  /**
   * How to read a fractional part, after the decimal word "فاصلة".
   * - `"off"` — truncate to the integer (default; backward compatible).
   * - `"digits"` — read each fractional digit (3.14 → "ثلاثة فاصلة واحد أربعة").
   * - `"number"` — read the fraction as a whole number (3.14 → "ثلاثة فاصلة أربعة عشر").
   */
  fraction?: "off" | "digits" | "number";
}

/** Word for a single decimal digit 0–9 (masculine). */
function digitToWord(d: number): string {
  return d === 0 ? "صفر" : (ONES_M[d] as string);
}

/** Digits after the decimal point in `n`'s canonical string form, else "". */
function fractionDigits(n: number): string {
  const s = Math.abs(n).toString();
  if (s.includes("e") || s.includes("E")) return ""; // skip scientific notation
  const dot = s.indexOf(".");
  return dot === -1 ? "" : s.slice(dot + 1);
}

/** Spell a non-negative integer (0 → "صفر"). */
function integerToWords(abs: number, gender: Gender): string {
  if (abs === 0) return "صفر";

  // Break into powers of 1000, from most significant.
  const groups: { count: number; scale: number }[] = [];
  let remaining = abs;
  for (let scale = SCALES.length - 1; scale >= 0; scale--) {
    const divisor = Math.pow(1000, scale);
    const count = Math.floor(remaining / divisor);
    if (count > 0) {
      groups.push({ count, scale });
      remaining %= divisor;
    }
  }

  const parts = groups.map(({ count, scale }) =>
    scale === 0
      ? under1000(count, gender)
      : scaleGroup(count, SCALES[scale] as ScaleWord),
  );
  return parts.join(" و");
}

/**
 * Convert a number to its Arabic word representation.
 *
 * Integers from 0 to ±999 trillion are spelled in full. By default a fractional
 * part is truncated; pass {@link ArabicWordsOptions.fraction} to read it too.
 *
 * @example arabicToWords(0)       // "صفر"
 * @example arabicToWords(11)      // "أحد عشر"
 * @example arabicToWords(25)      // "خمسة وعشرون"
 * @example arabicToWords(5000)    // "خمسة آلاف"
 * @example arabicToWords(1_234_567)
 * // "مليون ومئتان وأربعة وثلاثون ألفاً وخمسمئة وسبعة وستون"
 * @example arabicToWords(-42)     // "سالب اثنان وأربعون"
 * @example arabicToWords(5, { gender: "female" }) // "خمس"
 * @example arabicToWords(3.14, { fraction: "digits" }) // "ثلاثة فاصلة واحد أربعة"
 * @example arabicToWords(3.5, { fraction: "number" })  // "ثلاثة فاصلة خمسة"
 */
export function arabicToWords(
  n: number,
  options: ArabicWordsOptions = {},
): string {
  if (!Number.isFinite(n)) return "";

  const gender: Gender = options.gender ?? "male";
  const addNegative = options.negative ?? true;
  const fractionMode = options.fraction ?? "off";

  let result = integerToWords(Math.abs(Math.trunc(n)), gender);

  if (fractionMode !== "off") {
    const frac = fractionDigits(n);
    if (frac) {
      const fracWords =
        fractionMode === "digits"
          ? frac
              .split("")
              .map((c) => digitToWord(Number(c)))
              .join(" ")
          : integerToWords(Number(frac), gender);
      result = `${result} فاصلة ${fracWords}`;
    }
  }

  return n < 0 && addNegative ? `سالب ${result}` : result;
}
