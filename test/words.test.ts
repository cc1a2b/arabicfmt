import { describe, expect, it } from "vitest";
import { arabicToWords } from "../src/number/words";
import { arabicFraction } from "../src/number/fraction";
import { formatRelativeTime } from "../src/number/relative";
import { detectLocale } from "../src/locale";

// ---------------------------------------------------------------------------
// arabicToWords
// ---------------------------------------------------------------------------

describe("arabicToWords — small numbers", () => {
  it("zero", () => {
    expect(arabicToWords(0)).toBe("صفر");
  });

  it("one and two (masculine)", () => {
    expect(arabicToWords(1)).toBe("واحد");
    expect(arabicToWords(2)).toBe("اثنان");
  });

  it("one and two (feminine)", () => {
    expect(arabicToWords(1, { gender: "female" })).toBe("واحدة");
    expect(arabicToWords(2, { gender: "female" })).toBe("اثنتان");
  });

  it("3–9 masculine (default)", () => {
    const expected: Record<number, string> = {
      3: "ثلاثة", 4: "أربعة", 5: "خمسة",
      6: "ستة", 7: "سبعة", 8: "ثمانية", 9: "تسعة",
    };
    for (const [n, word] of Object.entries(expected)) {
      expect(arabicToWords(Number(n)), n).toBe(word);
    }
  });

  it("3–9 feminine", () => {
    const expected: Record<number, string> = {
      3: "ثلاث", 4: "أربع", 5: "خمس",
      6: "ست", 7: "سبع", 8: "ثماني", 9: "تسع",
    };
    for (const [n, word] of Object.entries(expected)) {
      expect(arabicToWords(Number(n), { gender: "female" }), n).toBe(word);
    }
  });
});

describe("arabicToWords — teens", () => {
  it("10–19 masculine", () => {
    expect(arabicToWords(10)).toBe("عشرة");
    expect(arabicToWords(11)).toBe("أحد عشر");
    expect(arabicToWords(12)).toBe("اثنا عشر");
    expect(arabicToWords(13)).toBe("ثلاثة عشر");
    expect(arabicToWords(19)).toBe("تسعة عشر");
  });

  it("10–19 feminine", () => {
    expect(arabicToWords(10, { gender: "female" })).toBe("عشر");
    expect(arabicToWords(11, { gender: "female" })).toBe("إحدى عشرة");
    expect(arabicToWords(12, { gender: "female" })).toBe("اثنتا عشرة");
    expect(arabicToWords(13, { gender: "female" })).toBe("ثلاث عشرة");
  });
});

describe("arabicToWords — tens and compounds", () => {
  it("exact tens", () => {
    expect(arabicToWords(20)).toBe("عشرون");
    expect(arabicToWords(30)).toBe("ثلاثون");
    expect(arabicToWords(90)).toBe("تسعون");
  });

  it("compound 21–99 (unit first)", () => {
    expect(arabicToWords(21)).toBe("واحد وعشرون");
    expect(arabicToWords(25)).toBe("خمسة وعشرون");
    expect(arabicToWords(99)).toBe("تسعة وتسعون");
  });

  it("feminine compound 'one' uses إحدى, not واحدة", () => {
    expect(arabicToWords(21, { gender: "female" })).toBe("إحدى وعشرون");
    expect(arabicToWords(51, { gender: "female" })).toBe("إحدى وخمسون");
    // standalone feminine 1 stays واحدة
    expect(arabicToWords(1, { gender: "female" })).toBe("واحدة");
    expect(arabicToWords(101, { gender: "female" })).toBe("مئة وواحدة");
  });
});

describe("arabicToWords — hundreds", () => {
  it("exact hundreds", () => {
    expect(arabicToWords(100)).toBe("مئة");
    expect(arabicToWords(200)).toBe("مئتان");
    expect(arabicToWords(300)).toBe("ثلاثمئة");
    expect(arabicToWords(900)).toBe("تسعمئة");
  });

  it("hundreds with remainder", () => {
    expect(arabicToWords(101)).toBe("مئة وواحد");
    expect(arabicToWords(115)).toBe("مئة وخمسة عشر");
    expect(arabicToWords(325)).toBe("ثلاثمئة وخمسة وعشرون");
  });
});

describe("arabicToWords — thousands", () => {
  it("1000 and 2000", () => {
    expect(arabicToWords(1000)).toBe("ألف");
    expect(arabicToWords(2000)).toBe("ألفان");
  });

  it("3000–10000 (plural: آلاف)", () => {
    expect(arabicToWords(3000)).toBe("ثلاثة آلاف");
    expect(arabicToWords(10000)).toBe("عشرة آلاف");
  });

  it("11000–99000 (tanwin: ألفاً)", () => {
    expect(arabicToWords(11000)).toBe("أحد عشر ألفاً");
    expect(arabicToWords(99000)).toBe("تسعة وتسعون ألفاً");
  });

  it("100000+", () => {
    expect(arabicToWords(100000)).toBe("مئة ألف");
    expect(arabicToWords(200000)).toBe("مئتان ألف");
  });

  it("thousands with remainder", () => {
    expect(arabicToWords(1001)).toBe("ألف وواحد");
    expect(arabicToWords(5300)).toBe("خمسة آلاف وثلاثمئة");
  });
});

describe("arabicToWords — millions and billions", () => {
  it("1 and 2 million", () => {
    expect(arabicToWords(1_000_000)).toBe("مليون");
    expect(arabicToWords(2_000_000)).toBe("مليونان");
  });

  it("3–10 million (ملايين)", () => {
    expect(arabicToWords(3_000_000)).toBe("ثلاثة ملايين");
    expect(arabicToWords(5_000_000)).toBe("خمسة ملايين");
  });

  it("11–99 million (مليوناً)", () => {
    expect(arabicToWords(15_000_000)).toBe("خمسة عشر مليوناً");
  });

  it("1 and 2 billion", () => {
    expect(arabicToWords(1_000_000_000)).toBe("مليار");
    expect(arabicToWords(2_000_000_000)).toBe("ملياران");
  });

  it("large composite number", () => {
    // 1,234,567 = مليون و مئتان وأربعة وثلاثون ألفاً و خمسمئة وسبعة وستون
    const result = arabicToWords(1_234_567);
    expect(result).toContain("مليون");
    expect(result).toContain("ألفاً");
  });
});

describe("arabicToWords — negatives", () => {
  it("prefixes with سالب by default", () => {
    expect(arabicToWords(-5)).toBe("سالب خمسة");
  });

  it("can suppress the negative prefix", () => {
    expect(arabicToWords(-5, { negative: false })).toBe("خمسة");
  });
});

describe("arabicToWords — decimals", () => {
  it("truncates by default (backward compatible)", () => {
    expect(arabicToWords(3.99)).toBe("ثلاثة");
    expect(arabicToWords(42.5)).toBe("اثنان وأربعون");
  });

  it("reads digits with fraction: 'digits'", () => {
    expect(arabicToWords(3.14, { fraction: "digits" })).toBe(
      "ثلاثة فاصلة واحد أربعة",
    );
    expect(arabicToWords(0.5, { fraction: "digits" })).toBe("صفر فاصلة خمسة");
  });

  it("reads the fraction as a number with fraction: 'number'", () => {
    expect(arabicToWords(3.14, { fraction: "number" })).toBe(
      "ثلاثة فاصلة أربعة عشر",
    );
    expect(arabicToWords(3.5, { fraction: "number" })).toBe(
      "ثلاثة فاصلة خمسة",
    );
  });

  it("handles negative decimals", () => {
    expect(arabicToWords(-2.25, { fraction: "number" })).toBe(
      "سالب اثنان فاصلة خمسة وعشرون",
    );
  });

  it("no فاصلة when there is no fractional part", () => {
    expect(arabicToWords(7, { fraction: "digits" })).toBe("سبعة");
  });
});

describe("arabicFraction", () => {
  it("unit fractions", () => {
    expect(arabicFraction(1, 2)).toBe("نصف");
    expect(arabicFraction(1, 3)).toBe("ثلث");
    expect(arabicFraction(1, 4)).toBe("ربع");
    expect(arabicFraction(1, 10)).toBe("عشر");
  });

  it("dual (2/n)", () => {
    expect(arabicFraction(2, 3)).toBe("ثلثان");
    expect(arabicFraction(2, 4)).toBe("ربعان");
  });

  it("3–10 numerators use plural", () => {
    expect(arabicFraction(3, 4)).toBe("ثلاثة أرباع");
    expect(arabicFraction(5, 8)).toBe("خمسة أثمان");
  });

  it("returns empty for unsupported input", () => {
    expect(arabicFraction(1, 11)).toBe("");
    expect(arabicFraction(0, 4)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// formatRelativeTime
// ---------------------------------------------------------------------------

describe("formatRelativeTime", () => {
  it("returns a string for seconds ago", () => {
    const past = new Date(Date.now() - 10_000);
    const out = formatRelativeTime(past, new Date(), { locale: "en" });
    expect(typeof out).toBe("string");
    expect(out.length).toBeGreaterThan(0);
  });

  it("returns Arabic text for Arabic locale", () => {
    const past = new Date(Date.now() - 3 * 86400_000);
    const out = formatRelativeTime(past, new Date(), { locale: "ar" });
    // Should contain Arabic characters
    expect(/[؀-ۿ]/.test(out)).toBe(true);
  });

  it("converts to Eastern Arabic digits when requested", () => {
    const past = new Date(Date.now() - 3 * 86400_000);
    const out = formatRelativeTime(past, new Date(), {
      locale: "ar",
      numerals: "arab",
    });
    expect(/[٠-٩]/.test(out)).toBe(true);
  });

  it("future date", () => {
    const future = new Date(Date.now() + 2 * 3600_000);
    const out = formatRelativeTime(future, new Date(), { locale: "en" });
    expect(out).toMatch(/in/i);
  });
});

// ---------------------------------------------------------------------------
// detectLocale
// ---------------------------------------------------------------------------

describe("detectLocale", () => {
  it("returns a non-empty string", () => {
    const loc = detectLocale();
    expect(typeof loc).toBe("string");
    expect(loc.length).toBeGreaterThan(0);
  });
});
