import { describe, expect, it } from "vitest";

import {
  ARABIC_INDIC_DIGITS,
  EXTENDED_ARABIC_INDIC_DIGITS,
  formatNumber,
  formatPercent,
  shapeDigits,
  toArabicDigits,
  toExtendedArabicDigits,
  toLatinDigits,
} from "../src/number/index";
import { formatHijriDate } from "../src/date/index";
import { formatList } from "../src/text/index";

describe("formatNumber", () => {
  it("groups thousands with Western numerals by default", () => {
    expect(formatNumber(1234567.89, { locale: "en" })).toBe("1,234,567.89");
  });

  it("does not force Eastern Arabic numerals", () => {
    expect(formatNumber(1234.5)).toMatch(/[0-9]/);
  });

  it("opts into Eastern Arabic numerals", () => {
    const out = formatNumber(1234.5, { numerals: "arab" });
    expect(out).not.toMatch(/[0-9]/);
    // Arabic uses U+066C as the group separator and U+066B as the decimal point.
    const normalized = toLatinDigits(out)
      .replace(new RegExp(`[,${String.fromCharCode(0x066c)}]`, "g"), "")
      .replace(new RegExp(String.fromCharCode(0x066b), "g"), ".");
    expect(Number.parseFloat(normalized)).toBe(1234.5);
  });

  it("respects fixed fraction digits and grouping toggle", () => {
    expect(formatNumber(5, { locale: "en", fractionDigits: 2 })).toBe("5.00");
    expect(formatNumber(1000, { locale: "en", grouping: false })).toBe("1000");
  });

  it("formats percentages", () => {
    expect(formatPercent(0.42, { locale: "en" })).toBe("42%");
  });
});

describe("numeral transliteration", () => {
  it("maps 0-9 to Arabic-Indic digits", () => {
    expect(toArabicDigits("2025")).toBe(
      ARABIC_INDIC_DIGITS[2]! +
        ARABIC_INDIC_DIGITS[0]! +
        ARABIC_INDIC_DIGITS[2]! +
        ARABIC_INDIC_DIGITS[5]!,
    );
  });

  it("round-trips through Latin digits", () => {
    expect(toLatinDigits(toArabicDigits("0123456789"))).toBe("0123456789");
  });

  it("also normalizes Extended (Persian) digits to Latin", () => {
    const persianFive = String.fromCharCode(0x06f5);
    expect(toLatinDigits(persianFive)).toBe("5");
  });

  it("leaves non-digits untouched", () => {
    expect(toArabicDigits("SAR 10")).toBe(
      `SAR ${ARABIC_INDIC_DIGITS[1]!}${ARABIC_INDIC_DIGITS[0]!}`,
    );
  });
});

describe("extended (Persian/Urdu) numerals", () => {
  it("maps 0-9 to Extended Arabic-Indic digits", () => {
    expect(toExtendedArabicDigits("2026")).toBe(
      EXTENDED_ARABIC_INDIC_DIGITS[2]! +
        EXTENDED_ARABIC_INDIC_DIGITS[0]! +
        EXTENDED_ARABIC_INDIC_DIGITS[2]! +
        EXTENDED_ARABIC_INDIC_DIGITS[6]!,
    );
    expect(toLatinDigits(toExtendedArabicDigits("0123456789"))).toBe(
      "0123456789",
    );
  });

  it("is distinct from the Eastern Arabic set", () => {
    expect(toExtendedArabicDigits("4")).not.toBe(toArabicDigits("4"));
  });

  it("shapeDigits dispatches on the numeral system", () => {
    expect(shapeDigits("7", "latn")).toBe("7");
    expect(shapeDigits("7", "arab")).toBe(ARABIC_INDIC_DIGITS[7]!);
    expect(shapeDigits("7", "arabext")).toBe(EXTENDED_ARABIC_INDIC_DIGITS[7]!);
  });

  it("formatNumber routes arabext through Intl's numbering system", () => {
    const out = formatNumber(1234.5, { numerals: "arabext" });
    expect(out).not.toMatch(/[0-9]/);
    expect(out).toMatch(
      new RegExp(`[${EXTENDED_ARABIC_INDIC_DIGITS[0]!}-${EXTENDED_ARABIC_INDIC_DIGITS[9]!}]`),
    );
  });

  it("reaches the hand-built formatters too", () => {
    const hijri = formatHijriDate(
      { year: 1447, month: 1, day: 1 },
      { numerals: "arabext" },
    );
    expect(hijri).toContain(EXTENDED_ARABIC_INDIC_DIGITS[1]!);
    expect(hijri).not.toMatch(/[0-9]/);

    expect(formatList([1, 2], { numerals: "arabext" })).toContain(
      EXTENDED_ARABIC_INDIC_DIGITS[1]!,
    );
  });
});
