/**
 * Arabic plural forms follow CLDR's six-form system, which is unique among
 * world languages. Standard libraries (i18next, formatjs) handle this via
 * locale data, but getting it right for Arabic requires care.
 *
 * CLDR plural rule for Arabic (integer n):
 *   zero:  n = 0
 *   one:   n = 1
 *   two:   n = 2
 *   few:   n mod 100 in 3..10
 *   many:  n mod 100 in 11..99
 *   other: everything else (100, 200, 1000, fractions, ...)
 */
export type ArabicPluralForm = "zero" | "one" | "two" | "few" | "many" | "other";

/**
 * Return the CLDR plural form for an Arabic count.
 *
 * @example arabicPluralForm(0)   // "zero"
 * @example arabicPluralForm(1)   // "one"
 * @example arabicPluralForm(2)   // "two"
 * @example arabicPluralForm(5)   // "few"   (3–10)
 * @example arabicPluralForm(15)  // "many"  (11–99)
 * @example arabicPluralForm(100) // "other"
 */
export function arabicPluralForm(n: number): ArabicPluralForm {
  const abs = Math.abs(Math.trunc(n));
  if (abs === 0) return "zero";
  if (abs === 1) return "one";
  if (abs === 2) return "two";
  const mod100 = abs % 100;
  if (mod100 >= 3 && mod100 <= 10) return "few";
  if (mod100 >= 11 && mod100 <= 99) return "many";
  return "other";
}

/** All six plural forms. Use as a key type for plural tables. */
export interface ArabicPluralForms<T = string> {
  zero?: T;
  one: T;
  two?: T;
  few: T;
  many: T;
  other: T;
}

/**
 * Select the correct Arabic plural form from a set of strings.
 *
 * @example
 * arabicPlural(5, { one: "كتاب", two: "كتابان", few: "كتب", many: "كتاباً", other: "كتاب" })
 * // "كتب"
 */
export function arabicPlural(
  n: number,
  forms: ArabicPluralForms,
): string {
  const form = arabicPluralForm(n);
  switch (form) {
    case "zero": return forms.zero ?? forms.other;
    case "one":  return forms.one;
    case "two":  return forms.two ?? forms.many;
    case "few":  return forms.few;
    case "many": return forms.many;
    case "other": return forms.other;
  }
}
