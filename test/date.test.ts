import { describe, expect, it } from "vitest";

import {
  formatHijriDate,
  fromHijri,
  HIJRI_MONTHS_AR,
  HIJRI_MONTHS_EN,
  toHijri,
} from "../src/date/index";
import {
  gregorianToUmalqura,
  isUmalquraYear,
  UMALQURA_FIRST_YEAR,
  UMALQURA_LAST_YEAR,
  umalquraToGregorian,
} from "../src/umalqura/index";

const utc = (y: number, m: number, d: number) => new Date(Date.UTC(y, m - 1, d));

describe("Umm al-Qura conversion", () => {
  it("matches the official date for 23 Sep 2025", () => {
    expect(gregorianToUmalqura(utc(2025, 9, 23))).toEqual({
      year: 1447,
      month: 4,
      day: 1,
    });
  });

  it("round-trips Hijri → Gregorian → Hijri", () => {
    for (let year = 1400; year <= 1470; year++) {
      for (const month of [1, 6, 9, 12]) {
        const greg = umalquraToGregorian(year, month, 15);
        expect(gregorianToUmalqura(greg)).toEqual({ year, month, day: 15 });
      }
    }
  });

  it("agrees with Intl's islamic-umalqura calendar across decades", () => {
    const icu = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
      year: "numeric",
      month: "numeric",
      day: "numeric",
      timeZone: "UTC",
    });
    for (let t = Date.UTC(1960, 0, 1); t < Date.UTC(2080, 0, 1); t += 53 * 86_400_000) {
      const date = new Date(t);
      const parts = icu.formatToParts(date);
      const field = (type: string) =>
        Number(parts.find((p) => p.type === type)!.value);
      expect(gregorianToUmalqura(date)).toEqual({
        year: field("year"),
        month: field("month"),
        day: field("day"),
      });
    }
  });

  it("reports and enforces its supported range", () => {
    expect(isUmalquraYear(UMALQURA_FIRST_YEAR)).toBe(true);
    expect(isUmalquraYear(UMALQURA_LAST_YEAR)).toBe(true);
    expect(isUmalquraYear(UMALQURA_FIRST_YEAR - 1)).toBe(false);
    expect(() => umalquraToGregorian(1200, 1, 1)).toThrow(/range/);
  });
});

describe("tabular core calendar", () => {
  it("round-trips without tables", () => {
    for (let year = 1350; year <= 1500; year++) {
      const greg = fromHijri(year, 7, 1);
      expect(toHijri(greg)).toEqual({ year, month: 7, day: 1 });
    }
  });

  it("stays within ~2 days of Umm al-Qura", () => {
    const tabular = fromHijri(1446, 9, 1).getTime();
    const official = umalquraToGregorian(1446, 9, 1).getTime();
    const diffDays = Math.abs(tabular - official) / 86_400_000;
    expect(diffDays).toBeLessThanOrEqual(2);
  });
});

describe("formatHijriDate", () => {
  it("uses Arabic names and era by default", () => {
    expect(formatHijriDate({ year: 1447, month: 1, day: 1 })).toBe(
      `1 ${HIJRI_MONTHS_AR[0]} 1447 ${"هـ"}`,
    );
  });

  it("formats in English", () => {
    expect(
      formatHijriDate({ year: 1447, month: 1, day: 1 }, { locale: "en" }),
    ).toBe(`1 ${HIJRI_MONTHS_EN[0]} 1447 AH`);
  });

  it("supports numeric months, custom order and no era", () => {
    expect(
      formatHijriDate(
        { year: 1447, month: 9, day: 1 },
        { locale: "en", month: "2-digit", day: "2-digit", era: false, order: "ymd" },
      ),
    ).toBe("1447/09/01");
  });

  it("converts digits to Eastern Arabic on request", () => {
    const out = formatHijriDate(
      { year: 1447, month: 1, day: 1 },
      { numerals: "arab" },
    );
    expect(out).not.toMatch(/[0-9]/);
  });
});
