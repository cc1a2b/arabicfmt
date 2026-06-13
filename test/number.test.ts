import { describe, expect, it } from "vitest";

import {
  ARABIC_INDIC_DIGITS,
  formatNumber,
  formatPercent,
  toArabicDigits,
  toLatinDigits,
} from "../src/number/index";

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
