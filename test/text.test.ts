import { describe, expect, it } from "vitest";

import {
  normalizeAlef,
  normalizeArabic,
  normalizeForSearch,
  normalizeTaaMarbuta,
  removeTatweel,
  stripTashkeel,
} from "../src/text/index";

const cc = String.fromCharCode;
const FATHA = cc(0x064e);
const SHADDA = cc(0x0651);
const DAMMA = cc(0x064f);
const ALEF = cc(0x0627);
const ALEF_HAMZA_ABOVE = cc(0x0623); // أ
const ALEF_HAMZA_BELOW = cc(0x0625); // إ
const ALEF_MADDA = cc(0x0622); // آ
const TAA_MARBUTA = cc(0x0629); // ة
const HAA = cc(0x0647); // ه
const TATWEEL = cc(0x0640);

describe("stripTashkeel", () => {
  it("removes harakat but keeps the letters", () => {
    const vocalized = `م${DAMMA}ح${FATHA}م${SHADDA}${FATHA}د`;
    expect(stripTashkeel(vocalized)).toBe("محمد");
  });
});

describe("removeTatweel", () => {
  it("strips the kashida elongation", () => {
    expect(removeTatweel(`م${TATWEEL}${TATWEEL}حمد`)).toBe("محمد");
  });
});

describe("normalizeAlef", () => {
  it("unifies every alef variant to a bare alef", () => {
    for (const variant of [ALEF_HAMZA_ABOVE, ALEF_HAMZA_BELOW, ALEF_MADDA]) {
      expect(normalizeAlef(`${variant}حمد`)).toBe(`${ALEF}حمد`);
    }
  });
});

describe("normalizeTaaMarbuta", () => {
  it("converts taa marbuta to haa", () => {
    expect(normalizeTaaMarbuta(`مدرس${TAA_MARBUTA}`)).toBe(`مدرس${HAA}`);
  });
});

describe("normalizeArabic", () => {
  it("applies the safe default folds (diacritics, alef, tatweel)", () => {
    const input = `${ALEF_HAMZA_ABOVE}ح${FATHA}م${TATWEEL}د`;
    expect(normalizeArabic(input)).toBe(`${ALEF}حمد`);
  });

  it("keeps taa marbuta unless explicitly enabled", () => {
    const input = `مدرس${TAA_MARBUTA}`;
    expect(normalizeArabic(input)).toBe(input);
    expect(normalizeArabic(input, { taaMarbuta: true })).toBe(`مدرس${HAA}`);
  });
});

describe("normalizeForSearch", () => {
  it("makes spelling variants of a word compare equal", () => {
    const a = normalizeForSearch(`${ALEF_HAMZA_ABOVE}حم${FATHA}د`);
    const b = normalizeForSearch(`${ALEF}حمد`);
    expect(a).toBe(b);
  });

  it("folds digits and collapses whitespace", () => {
    const arabicTwo = cc(0x0662);
    expect(normalizeForSearch(`رقم   ${arabicTwo}`)).toBe("رقم 2");
  });
});
