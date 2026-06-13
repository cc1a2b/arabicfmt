import { describe, expect, it } from "vitest";
import { transliterate, slugify } from "../src/text/transliterate";

describe("transliterate", () => {
  it("romanizes consonants (bare text is consonant-only)", () => {
    expect(transliterate("محمد")).toBe("mhmd");
    expect(transliterate("القاهرة")).toBe("alqahrh");
  });

  it("uses short vowels when the text is vowelled", () => {
    expect(transliterate("مُحَمَّد")).toBe("muhammad");
  });

  it("doubles consonants on shadda", () => {
    expect(transliterate("السّلام")).toBe("alsslam");
  });

  it("converts Arabic-Indic digits", () => {
    expect(transliterate("غرفة ٢٠١")).toBe("ghrfh 201");
  });

  it("passes Latin text and spacing through", () => {
    expect(transliterate("Hello العالم")).toBe("Hello al'alm");
  });

  it("drops tatweel", () => {
    expect(transliterate("كـــتاب")).toBe("ktab");
  });
});

describe("slugify", () => {
  it("produces URL-safe slugs", () => {
    expect(slugify("مدينة نصر")).toBe("mdynh-nsr");
    expect(slugify("القاهرة 2026")).toBe("alqahrh-2026");
  });

  it("drops the ع / ء apostrophes", () => {
    expect(slugify("السعودية")).toBe("alswdyh");
  });

  it("mixes Latin and Arabic, lower-cased", () => {
    expect(slugify("Hello العالم")).toBe("hello-alalm");
  });

  it("custom separator", () => {
    expect(slugify("Hello العالم", { separator: "_" })).toBe("hello_alalm");
  });

  it("can preserve case", () => {
    expect(slugify("Hello World", { lowercase: false })).toBe("Hello-World");
  });

  it("trims and collapses separators", () => {
    expect(slugify("  نصر،،، مدينة  ")).toBe("nsr-mdynh");
  });
});
