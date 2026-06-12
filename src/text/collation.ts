/**
 * Arabic-locale-aware string comparison and collation.
 *
 * Arabic sorting follows different rules from default Unicode code-point order:
 *   - Hamza and alef variants should sort together.
 *   - Tashkeel (diacritics) should be ignored when sorting.
 *   - `Intl.Collator` with `"ar"` handles all of this natively.
 */

/**
 * Compare two strings using Arabic locale collation. Drop-in replacement for
 * the `compareFunction` argument to `Array.prototype.sort`.
 *
 * @example ["ب", "أ", "ت"].sort(compareArabic) // ["أ", "ب", "ت"]
 */
export function compareArabic(a: string, b: string): number {
  return arabicCollator.compare(a, b);
}

const arabicCollator = new Intl.Collator("ar", {
  sensitivity: "base",
  ignorePunctuation: true,
});

/**
 * Create an `Intl.Collator` configured for Arabic with sensible defaults.
 * Override any option via `options`.
 *
 * @example
 * const col = createArabicCollator({ sensitivity: "variant" });
 * names.sort((a, b) => col.compare(a, b));
 */
export function createArabicCollator(
  options?: Intl.CollatorOptions,
): Intl.Collator {
  return new Intl.Collator("ar", {
    sensitivity: "base",
    ignorePunctuation: true,
    ...options,
  });
}

/**
 * Sort an array of strings using Arabic collation. Returns a new sorted array.
 *
 * @example sortArabic(["ياسر", "أحمد", "بسام"]) // ["أحمد", "بسام", "ياسر"]
 */
export function sortArabic(strings: readonly string[]): string[] {
  return [...strings].sort(compareArabic);
}
