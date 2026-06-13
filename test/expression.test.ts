import { describe, expect, it } from "vitest";
import { arabicOrdinal } from "../src/number/ordinal";
import { spellCurrency } from "../src/currency/tafqit";
import { formatList } from "../src/text/list";

// ---------------------------------------------------------------------------
// arabicOrdinal
// ---------------------------------------------------------------------------

describe("arabicOrdinal — 1–10", () => {
  it("masculine", () => {
    const expected = [
      "الأول", "الثاني", "الثالث", "الرابع", "الخامس",
      "السادس", "السابع", "الثامن", "التاسع", "العاشر",
    ];
    expected.forEach((word, i) => {
      expect(arabicOrdinal(i + 1)).toBe(word);
    });
  });

  it("feminine", () => {
    const expected = [
      "الأولى", "الثانية", "الثالثة", "الرابعة", "الخامسة",
      "السادسة", "السابعة", "الثامنة", "التاسعة", "العاشرة",
    ];
    expected.forEach((word, i) => {
      expect(arabicOrdinal(i + 1, { gender: "female" })).toBe(word);
    });
  });
});

describe("arabicOrdinal — teens", () => {
  it("11–19 masculine", () => {
    expect(arabicOrdinal(11)).toBe("الحادي عشر");
    expect(arabicOrdinal(12)).toBe("الثاني عشر");
    expect(arabicOrdinal(15)).toBe("الخامس عشر");
    expect(arabicOrdinal(19)).toBe("التاسع عشر");
  });

  it("11–19 feminine", () => {
    expect(arabicOrdinal(11, { gender: "female" })).toBe("الحادية عشرة");
    expect(arabicOrdinal(12, { gender: "female" })).toBe("الثانية عشرة");
  });
});

describe("arabicOrdinal — tens and compounds", () => {
  it("exact tens", () => {
    expect(arabicOrdinal(20)).toBe("العشرون");
    expect(arabicOrdinal(30)).toBe("الثلاثون");
    expect(arabicOrdinal(90)).toBe("التسعون");
  });

  it("compound 21–99 (unit first)", () => {
    expect(arabicOrdinal(21)).toBe("الحادي والعشرون");
    expect(arabicOrdinal(25)).toBe("الخامس والعشرون");
    expect(arabicOrdinal(99)).toBe("التاسع والتسعون");
  });

  it("compound feminine", () => {
    expect(arabicOrdinal(21, { gender: "female" })).toBe("الحادية والعشرون");
    expect(arabicOrdinal(25, { gender: "female" })).toBe("الخامسة والعشرون");
  });
});

describe("arabicOrdinal — indefinite", () => {
  it("strips the definite article", () => {
    expect(arabicOrdinal(1, { definite: false })).toBe("أول");
    expect(arabicOrdinal(3, { definite: false })).toBe("ثالث");
    expect(arabicOrdinal(11, { definite: false })).toBe("حادي عشر");
    expect(arabicOrdinal(25, { definite: false })).toBe("خامس وعشرون");
  });

  it("indefinite feminine", () => {
    expect(arabicOrdinal(1, { gender: "female", definite: false })).toBe("أولى");
  });
});

describe("arabicOrdinal — edge cases", () => {
  it("≥ 100 uses definite cardinal fallback", () => {
    expect(arabicOrdinal(100)).toBe("المئة");
    expect(arabicOrdinal(1000)).toBe("الألف");
  });

  it("non-positive returns empty string", () => {
    expect(arabicOrdinal(0)).toBe("");
    expect(arabicOrdinal(-3)).toBe("");
  });
});

// ---------------------------------------------------------------------------
// spellCurrency (التفقيط)
// ---------------------------------------------------------------------------

describe("spellCurrency — major unit agreement (SAR)", () => {
  it("1 → singular", () => {
    expect(spellCurrency(1, { currency: "SAR" })).toBe("ريال واحد");
  });
  it("2 → dual", () => {
    expect(spellCurrency(2, { currency: "SAR" })).toBe("ريالان");
  });
  it("3–10 → plural", () => {
    expect(spellCurrency(3, { currency: "SAR" })).toBe("ثلاثة ريالات");
    expect(spellCurrency(10, { currency: "SAR" })).toBe("عشرة ريالات");
  });
  it("11–99 → accusative singular", () => {
    expect(spellCurrency(11, { currency: "SAR" })).toBe("أحد عشر ريالاً");
    expect(spellCurrency(50, { currency: "SAR" })).toBe("خمسون ريالاً");
  });
  it("100 → genitive singular", () => {
    expect(spellCurrency(100, { currency: "SAR" })).toBe("مئة ريال");
  });
});

describe("spellCurrency — with minor units", () => {
  it("major + minor joined with و", () => {
    expect(spellCurrency(1234.5, { currency: "SAR" })).toBe(
      "ألف ومئتان وأربعة وثلاثون ريالاً وخمسون هللةً",
    );
  });

  it("minor only (no major), feminine agreement", () => {
    // هللة is feminine → "خمس" (not "خمسة"); 75 → accusative tamyiz هللةً
    expect(spellCurrency(0.75, { currency: "SAR" })).toBe("خمس وسبعون هللةً");
  });

  it("rounds to currency precision; feminine compound uses إحدى", () => {
    // SAR has 2 decimals → 0.509 rounds to 51 halalas → "إحدى وخمسون"
    expect(spellCurrency(0.509, { currency: "SAR" })).toBe("إحدى وخمسون هللةً");
  });
});

describe("spellCurrency — precision varies by currency", () => {
  it("KWD uses 1000 fils (3 decimals)", () => {
    expect(spellCurrency(1.5, { currency: "KWD" })).toBe(
      "دينار واحد وخمسمئة فلس",
    );
  });

  it("KWD dual", () => {
    expect(spellCurrency(2, { currency: "KWD" })).toBe("ديناران");
  });

  it("EGP pounds and piastres", () => {
    expect(spellCurrency(5, { currency: "EGP" })).toBe("خمسة جنيهات");
  });

  it("AED dirhams", () => {
    expect(spellCurrency(3, { currency: "AED" })).toBe("ثلاثة دراهم");
  });
});

describe("spellCurrency — options", () => {
  it("zero", () => {
    expect(spellCurrency(0, { currency: "SAR" })).toBe("صفر ريال");
  });

  it("suffix true adds the cheque ending", () => {
    expect(spellCurrency(100, { currency: "EGP", suffix: true })).toBe(
      "مئة جنيه فقط لا غير",
    );
  });

  it("custom suffix", () => {
    expect(spellCurrency(100, { currency: "EGP", suffix: "فقط" })).toBe(
      "مئة جنيه فقط",
    );
  });

  it("negative", () => {
    expect(spellCurrency(-5, { currency: "AED" })).toBe("سالب خمسة دراهم");
  });

  it("derives currency from locale region", () => {
    expect(spellCurrency(2, { locale: "ar-AE" })).toBe("درهمان");
  });

  it("unknown currency falls back to ISO code", () => {
    const out = spellCurrency(5, { currency: "USD" });
    expect(out).toContain("USD");
  });
});

// ---------------------------------------------------------------------------
// formatList
// ---------------------------------------------------------------------------

describe("formatList", () => {
  it("conjunction (default)", () => {
    const out = formatList(["أحمد", "محمد", "علي"]);
    // Intl may render "أحمد ومحمد وعلي"; ensure all names + a waw present
    expect(out).toContain("أحمد");
    expect(out).toContain("علي");
    expect(out).toContain("و");
  });

  it("single item", () => {
    expect(formatList(["أحمد"])).toBe("أحمد");
  });

  it("empty list", () => {
    expect(formatList([])).toBe("");
  });

  it("disjunction contains أو", () => {
    const out = formatList(["تفاح", "موز"], { type: "disjunction" });
    expect(out).toContain("أو");
  });

  it("numbers with arab numerals", () => {
    const out = formatList([1, 2, 3], { numerals: "arab" });
    expect(/[٠-٩]/.test(out)).toBe(true);
  });
});
