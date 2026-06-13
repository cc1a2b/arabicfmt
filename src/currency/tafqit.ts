/**
 * التفقيط — spell a monetary amount in full Arabic words.
 *
 * This is the operation every Arabic invoice, cheque and contract needs:
 * turning `1234.50 SAR` into "ألف ومئتان وأربعة وثلاثون ريالاً وخمسون هللة".
 *
 * The grammar of the counted noun (العدد والمعدود) is non-trivial:
 *   - 1            → singular            (ريال واحد)
 *   - 2            → dual                (ريالان)
 *   - n%100 3–10   → plural              (ثلاثة ريالات)
 *   - n%100 11–99  → accusative singular (أحد عشر ريالاً)
 *   - n%100 0/1/2  → genitive singular   (مئة ريال)
 * The number itself is produced by {@link arabicToWords}; this module only
 * supplies the correctly-inflected unit noun and joins the parts.
 */

import { countedNoun, type CountedNoun } from "../number/count";
import { currencyDigits, currencyForLocale } from "./data";
import { DEFAULT_LOCALE } from "../locale";

/**
 * The four inflected forms a currency noun needs for Arabic number agreement.
 * Structurally identical to {@link CountedNoun} (re-exported for discoverability).
 */
export type CurrencyNoun = CountedNoun;

export interface CurrencyWords {
  /** Major unit, e.g. the riyal. */
  major: CurrencyNoun;
  /** Minor unit, e.g. the halala. Omitted for currencies with no subunit. */
  minor?: CurrencyNoun;
}

// --- reusable noun paradigms -----------------------------------------------

const RIYAL: CurrencyNoun = { gender: "male", singular: "ريال", dual: "ريالان", plural: "ريالات", accusative: "ريالاً" };
const DINAR: CurrencyNoun = { gender: "male", singular: "دينار", dual: "ديناران", plural: "دنانير", accusative: "ديناراً" };
const DIRHAM: CurrencyNoun = { gender: "male", singular: "درهم", dual: "درهمان", plural: "دراهم", accusative: "درهماً" };
const JUNAYH: CurrencyNoun = { gender: "male", singular: "جنيه", dual: "جنيهان", plural: "جنيهات", accusative: "جنيهاً" };
const LIRA: CurrencyNoun = { gender: "female", singular: "ليرة", dual: "ليرتان", plural: "ليرات", accusative: "ليرةً" };
const FRANC: CurrencyNoun = { gender: "male", singular: "فرنك", dual: "فرنكان", plural: "فرنكات", accusative: "فرنكاً" };
const SHILLING: CurrencyNoun = { gender: "male", singular: "شلن", dual: "شلنان", plural: "شلنات", accusative: "شلناً" };
const OUGUIYA: CurrencyNoun = { gender: "female", singular: "أوقية", dual: "أوقيتان", plural: "أوقيات", accusative: "أوقيةً" };

const FILS: CurrencyNoun = { gender: "male", singular: "فلس", dual: "فلسان", plural: "فلوس", accusative: "فلساً" };
const HALALA: CurrencyNoun = { gender: "female", singular: "هللة", dual: "هللتان", plural: "هللات", accusative: "هللةً" };
const QIRSH: CurrencyNoun = { gender: "male", singular: "قرش", dual: "قرشان", plural: "قروش", accusative: "قرشاً" };
const SANTEEM: CurrencyNoun = { gender: "male", singular: "سنتيم", dual: "سنتيمان", plural: "سنتيمات", accusative: "سنتيماً" };
const BAISA: CurrencyNoun = { gender: "female", singular: "بيسة", dual: "بيستان", plural: "بيسات", accusative: "بيسةً" };
const MILLIME: CurrencyNoun = { gender: "male", singular: "مليم", dual: "مليمان", plural: "مليمات", accusative: "مليماً" };
const CENT: CurrencyNoun = { gender: "male", singular: "سنت", dual: "سنتان", plural: "سنتات", accusative: "سنتاً" };

/**
 * Arabic noun paradigms for the 22 Arab League currencies (+ neighbours).
 * The number of minor units per major is derived from CLDR precision, so it is
 * never stated twice — see {@link currencyDigits}.
 */
export const CURRENCY_WORDS: Readonly<Record<string, CurrencyWords>> = {
  SAR: { major: RIYAL, minor: HALALA },
  QAR: { major: RIYAL, minor: DIRHAM },
  YER: { major: RIYAL, minor: FILS },
  OMR: { major: RIYAL, minor: BAISA },
  AED: { major: DIRHAM, minor: FILS },
  MAD: { major: DIRHAM, minor: SANTEEM },
  KWD: { major: DINAR, minor: FILS },
  BHD: { major: DINAR, minor: FILS },
  IQD: { major: DINAR, minor: FILS },
  JOD: { major: DINAR, minor: FILS },
  LYD: { major: DINAR, minor: DIRHAM },
  TND: { major: DINAR, minor: MILLIME },
  DZD: { major: DINAR, minor: SANTEEM },
  EGP: { major: JUNAYH, minor: QIRSH },
  SDG: { major: JUNAYH, minor: QIRSH },
  LBP: { major: LIRA, minor: QIRSH },
  SYP: { major: LIRA, minor: QIRSH },
  SOS: { major: SHILLING, minor: CENT },
  DJF: { major: FRANC },
  KMF: { major: FRANC },
  MRU: { major: OUGUIYA },
};

/** Build an opaque paradigm for an unknown currency, using its ISO code. */
function genericWords(code: string): CurrencyWords {
  const noun: CurrencyNoun = {
    gender: "male",
    singular: code,
    dual: code,
    plural: code,
    accusative: code,
  };
  return { major: noun };
}

export interface SpellCurrencyOptions {
  /** ISO 4217 code (e.g. `"SAR"`). Required unless `locale` implies one. */
  currency?: string;
  /** BCP-47 locale; its region selects a currency when `currency` is absent. */
  locale?: string;
  /**
   * Append a closing phrase. `true` adds the classic cheque ending
   * "فقط لا غير"; a string appends that string verbatim.
   */
  suffix?: boolean | string;
  /** Prefix for negative amounts. Default `"سالب"`. */
  negativePrefix?: string;
}

/**
 * Spell a monetary amount in full Arabic words (التفقيط).
 *
 * Splits the amount into major and minor units using the currency's CLDR
 * precision (so KWD yields 1000 fils, SAR yields 100 halalas), inflects each
 * unit noun for correct agreement, and joins them with و.
 *
 * @example
 * spellCurrency(1234.5, { currency: "SAR" })
 * // "ألف ومئتان وأربعة وثلاثون ريالاً وخمسون هللة"
 *
 * @example
 * spellCurrency(2, { currency: "KWD" })            // "ديناران"
 * spellCurrency(1.5, { currency: "KWD" })          // "دينار واحد وخمسمئة فلس"
 * spellCurrency(0.75, { currency: "SAR" })         // "خمسة وسبعون هللةً"
 * spellCurrency(100, { currency: "EGP", suffix: true })
 * // "مئة جنيه فقط لا غير"
 * spellCurrency(-5, { locale: "ar-AE" })           // "سالب خمسة دراهم"
 */
export function spellCurrency(
  amount: number,
  options: SpellCurrencyOptions = {},
): string {
  if (!Number.isFinite(amount)) return "";

  const code = (
    options.currency ??
    currencyForLocale(options.locale ?? DEFAULT_LOCALE) ??
    ""
  ).toUpperCase();

  const words = CURRENCY_WORDS[code] ?? genericWords(code || "وحدة");
  const digits = currencyDigits(code);
  const minorPerMajor = digits > 0 ? 10 ** digits : 1;

  const negative = amount < 0;
  const abs = Math.abs(amount);

  // Scale once to avoid floating-point drift, then split.
  const scaled = Math.round(abs * minorPerMajor);
  const major = Math.floor(scaled / minorPerMajor);
  const minor = scaled - major * minorPerMajor;

  const parts: string[] = [];
  if (major > 0) parts.push(countedNoun(major, words.major));
  if (minor > 0 && words.minor) parts.push(countedNoun(minor, words.minor));

  let result =
    parts.length === 0 ? `صفر ${words.major.singular}` : parts.join(" و");

  if (options.suffix === true) result += " فقط لا غير";
  else if (typeof options.suffix === "string") result += ` ${options.suffix}`;

  if (negative) result = `${options.negativePrefix ?? "سالب"} ${result}`;
  return result;
}
