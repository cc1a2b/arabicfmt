import { describe, expect, it } from "vitest";

import { formatCompact, formatNumber, parseCurrency, parseNumber } from "../src/number/index";
import { formatCurrency } from "../src/currency/index";
import {
  arabicPlural,
  arabicPluralForm,
  compareArabic,
  sortArabic,
} from "../src/text/index";
import {
  GREGORIAN_MONTHS_AR,
  GREGORIAN_MONTHS_EN,
  ARABIC_WEEKDAYS_AR,
  ARABIC_WEEKDAYS_EN,
  HIJRI_MONTHS_AR,
} from "../src/date/index";

// ---------------------------------------------------------------------------
// Compact notation
// ---------------------------------------------------------------------------

describe("formatCompact", () => {
  it("renders millions in English", () => {
    const out = formatCompact(1_200_000, { locale: "en" });
    expect(out).toMatch(/1\.?2M/i);
  });

  it("renders compact in Arabic locale with Eastern digits", () => {
    const out = formatCompact(1_200_000, { locale: "ar", numerals: "arab" });
    expect(out).not.toMatch(/[0-9]/);
  });

  it("forwards to formatNumber notation option", () => {
    const a = formatCompact(5_000, { locale: "en" });
    const b = formatNumber(5_000, { locale: "en", notation: "compact" });
    expect(a).toBe(b);
  });
});

// ---------------------------------------------------------------------------
// Accounting format
// ---------------------------------------------------------------------------

describe("formatCurrency accounting mode", () => {
  it("wraps negative values in parentheses", () => {
    const out = formatCurrency(-1234.5, { currency: "SAR", accounting: true });
    expect(out).toMatch(/^\(.*\)$/);
    expect(out).toContain("1,234.50");
  });

  it("positive values are not parenthesized", () => {
    const out = formatCurrency(1234.5, { currency: "SAR", accounting: true });
    expect(out).not.toMatch(/^\(/);
  });

  it("zero is not parenthesized", () => {
    const out = formatCurrency(0, { currency: "SAR", accounting: true });
    expect(out).not.toMatch(/^\(/);
  });
});

// ---------------------------------------------------------------------------
// parseNumber / parseCurrency
// ---------------------------------------------------------------------------

describe("parseNumber", () => {
  it("parses Western number strings", () => {
    expect(parseNumber("1,234.56")).toBe(1234.56);
  });

  it("parses Eastern Arabic digit strings", () => {
    const arabicStr = "١٬٢٣٤٫٥٦";
    expect(parseNumber(arabicStr)).toBe(1234.56);
  });

  it("handles integers", () => {
    expect(parseNumber("٢٠٢٦")).toBe(2026);
  });

  it("returns NaN for non-numeric input", () => {
    expect(parseNumber("hello")).toBeNaN();
  });
});

describe("parseCurrency", () => {
  it("strips the Arabic text symbol and returns the amount", () => {
    const out = formatCurrency(1234.5, { currency: "SAR" });
    expect(parseCurrency(out)).toBeCloseTo(1234.5, 2);
  });

  it("parses Eastern Arabic currency strings", () => {
    const out = formatCurrency(1234.5, { currency: "SAR", numerals: "arab" });
    expect(parseCurrency(out)).toBeCloseTo(1234.5, 2);
  });

  it("handles accounting notation parentheses as negative", () => {
    const out = formatCurrency(-500, { currency: "SAR", accounting: true });
    expect(parseCurrency(out)).toBeCloseTo(-500, 2);
  });
});

// ---------------------------------------------------------------------------
// Arabic plural rules
// ---------------------------------------------------------------------------

describe("arabicPluralForm", () => {
  it("returns the six CLDR plural forms correctly", () => {
    expect(arabicPluralForm(0)).toBe("zero");
    expect(arabicPluralForm(1)).toBe("one");
    expect(arabicPluralForm(2)).toBe("two");
    expect(arabicPluralForm(5)).toBe("few");
    expect(arabicPluralForm(10)).toBe("few");
    expect(arabicPluralForm(11)).toBe("many");
    expect(arabicPluralForm(99)).toBe("many");
    expect(arabicPluralForm(100)).toBe("other");
    expect(arabicPluralForm(103)).toBe("few");
    expect(arabicPluralForm(111)).toBe("many");
  });
});

describe("arabicPlural", () => {
  const forms = {
    zero: "لا كتب",
    one: "كتاب",
    two: "كتابان",
    few: "كتب",
    many: "كتاباً",
    other: "كتاب",
  };
  it("selects the correct form", () => {
    expect(arabicPlural(0, forms)).toBe("لا كتب");
    expect(arabicPlural(1, forms)).toBe("كتاب");
    expect(arabicPlural(2, forms)).toBe("كتابان");
    expect(arabicPlural(5, forms)).toBe("كتب");
    expect(arabicPlural(15, forms)).toBe("كتاباً");
    expect(arabicPlural(100, forms)).toBe("كتاب");
  });
});

// ---------------------------------------------------------------------------
// Collation
// ---------------------------------------------------------------------------

describe("sortArabic", () => {
  it("sorts Arabic names lexicographically", () => {
    const names = ["ياسر", "أحمد", "بسام"];
    const sorted = sortArabic(names);
    // أ comes before ب comes before ي
    expect(sorted.indexOf("أحمد")).toBeLessThan(sorted.indexOf("بسام"));
    expect(sorted.indexOf("بسام")).toBeLessThan(sorted.indexOf("ياسر"));
  });

  it("treats alef variants as equal (base sensitivity)", () => {
    const words = ["إبراهيم", "ابراهيم", "أبراهيم"];
    // All three should sort together, not be separated by non-alef words
    const sorted = sortArabic([...words, "بكر"]);
    const ibrahimIndices = words.map((w) => sorted.indexOf(w));
    const bakrIndex = sorted.indexOf("بكر");
    // All Ibrahim variants come before بكر
    for (const idx of ibrahimIndices) {
      expect(idx).toBeLessThan(bakrIndex);
    }
  });

  it("returns a new array and does not mutate the original", () => {
    const original = ["ج", "أ", "ب"];
    const sorted = sortArabic(original);
    expect(sorted).not.toBe(original);
    expect(original).toEqual(["ج", "أ", "ب"]);
  });
});

describe("compareArabic", () => {
  it("returns 0 for equal strings", () => {
    expect(compareArabic("مرحبا", "مرحبا")).toBe(0);
  });

  it("can be used directly in Array.sort", () => {
    const arr = ["ياسر", "أحمد", "بسام"];
    arr.sort(compareArabic);
    expect(arr[0]).toBe("أحمد");
  });
});

// ---------------------------------------------------------------------------
// Gregorian month names
// ---------------------------------------------------------------------------

describe("GREGORIAN_MONTHS_AR", () => {
  it("has 12 entries", () => {
    expect(GREGORIAN_MONTHS_AR).toHaveLength(12);
    expect(GREGORIAN_MONTHS_EN).toHaveLength(12);
  });

  it("January maps to يناير", () => {
    expect(GREGORIAN_MONTHS_AR[0]).toBe("يناير");
  });

  it("December maps to ديسمبر", () => {
    expect(GREGORIAN_MONTHS_AR[11]).toBe("ديسمبر");
  });
});

// ---------------------------------------------------------------------------
// Weekday names
// ---------------------------------------------------------------------------

describe("ARABIC_WEEKDAYS", () => {
  it("has 7 entries, index 0 = Sunday", () => {
    expect(ARABIC_WEEKDAYS_AR).toHaveLength(7);
    expect(ARABIC_WEEKDAYS_EN).toHaveLength(7);
    expect(ARABIC_WEEKDAYS_AR[0]).toBe("الأحد");
    expect(ARABIC_WEEKDAYS_EN[5]).toBe("Friday");
  });
});

// ---------------------------------------------------------------------------
// Hijri month names sanity
// ---------------------------------------------------------------------------

describe("HIJRI_MONTHS_AR", () => {
  it("has 12 entries starting with Muharram", () => {
    expect(HIJRI_MONTHS_AR).toHaveLength(12);
    expect(HIJRI_MONTHS_AR[8]).toBe("رمضان");
  });
});
