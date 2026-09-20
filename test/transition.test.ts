import { describe, expect, it } from "vitest";

import {
  CURRENCY_TRANSITIONS,
  getCurrencyInfo,
  getCurrencyTransition,
  listCurrencyTransitions,
  resolveCurrencySymbol,
  signFontFaceCSS,
  signUnicodeRange,
  transitionStatus,
} from "../src/currency/index";

const MVR_SIGN = String.fromCodePoint(0x20c2);

describe("Unicode 18.0 sign batch", () => {
  it("covers exactly the four signs of this transition, in codepoint order", () => {
    expect(CURRENCY_TRANSITIONS.map((t) => t.code)).toEqual([
      "SAR",
      "MVR",
      "AED",
      "OMR",
    ]);
    expect(CURRENCY_TRANSITIONS.map((t) => t.codepoint)).toEqual([
      "U+20C1",
      "U+20C2",
      "U+20C3",
      "U+20C4",
    ]);
  });

  it("carries the rufiyaa sign added in Unicode 18.0", () => {
    const mvr = getCurrencyTransition("MVR");
    expect(mvr).toBeDefined();
    expect(mvr!.sign).toBe(MVR_SIGN);
    expect(mvr!.sign.codePointAt(0)).toBe(0x20c2);
    expect(mvr!.name).toBe("RUFIYAA SIGN");
    expect(mvr!.unicodeVersion).toBe("18.0");
    expect(mvr!.authority).toContain("Maldives");
  });

  it("every declared codepoint matches the actual character", () => {
    for (const t of CURRENCY_TRANSITIONS) {
      const actual =
        "U+" +
        (t.sign.codePointAt(0) ?? 0).toString(16).toUpperCase().padStart(4, "0");
      expect(actual, t.code).toBe(t.codepoint);
    }
  });

  it("splits SAR (Unicode 17.0) from the 18.0 batch", () => {
    expect(
      listCurrencyTransitions({ unicodeVersion: "17.0" }).map((t) => t.code),
    ).toEqual(["SAR"]);
    expect(
      listCurrencyTransitions({ unicodeVersion: "18.0" }).map((t) => t.code),
    ).toEqual(["MVR", "AED", "OMR"]);
  });

  it("is case-insensitive and reports currencies without a sign", () => {
    expect(getCurrencyTransition("sar")?.code).toBe("SAR");
    expect(getCurrencyTransition("KWD")).toBeUndefined();
    expect(getCurrencyTransition("USD")).toBeUndefined();
  });

  it("exposes the new metadata through getCurrencyInfo", () => {
    const info = getCurrencyInfo("OMR");
    expect(info.unicode?.name).toBe("OMANI RIAL SIGN");
    expect(info.unicode?.announced).toBe("2025-11-19");
    expect(info.unicode?.authority).toContain("Oman");
  });

  it("resolves the rufiyaa sign under auto and its text form under text", () => {
    expect(resolveCurrencySymbol("MVR", { mode: "auto" })).toBe(MVR_SIGN);
    expect(resolveCurrencySymbol("MVR", { mode: "text" })).toBe("Rf.");
  });
});

describe("transitionStatus", () => {
  it("walks SAR through none → announced → encoded", () => {
    expect(transitionStatus("SAR", new Date("2025-01-01"))).toBe("none");
    expect(transitionStatus("SAR", new Date("2025-02-20"))).toBe("announced");
    expect(transitionStatus("SAR", new Date("2025-09-08"))).toBe("announced");
    expect(transitionStatus("SAR", new Date("2025-09-09"))).toBe("encoded");
  });

  it("holds the 18.0 signs at announced until Unicode 18.0 shipped", () => {
    const beforeRelease = new Date("2026-01-01");
    for (const code of ["AED", "OMR", "MVR"]) {
      expect(transitionStatus(code, beforeRelease), code).toBe("announced");
      expect(transitionStatus(code, new Date("2026-09-16")), code).toBe("encoded");
    }
  });

  it("reports every sign as encoded today", () => {
    for (const t of CURRENCY_TRANSITIONS) {
      expect(transitionStatus(t.code), t.code).toBe("encoded");
    }
  });

  it("reports none for currencies that never got a sign", () => {
    expect(transitionStatus("KWD")).toBe("none");
    expect(transitionStatus("EGP")).toBe("none");
    expect(transitionStatus("USD")).toBe("none");
  });

  it("rejects an invalid Date instead of guessing", () => {
    expect(() => transitionStatus("SAR", new Date("not-a-date"))).toThrow(
      TypeError,
    );
  });

  it("filters by encoded status at a moment in time", () => {
    expect(
      listCurrencyTransitions({
        encodedOnly: true,
        at: new Date("2026-06-01"),
      }).map((t) => t.code),
    ).toEqual(["SAR"]);
    expect(
      listCurrencyTransitions({ encodedOnly: true, at: new Date("2024-01-01") }),
    ).toEqual([]);
  });
});

describe("signUnicodeRange", () => {
  it("covers every sign by default", () => {
    expect(signUnicodeRange()).toBe("U+20C1, U+20C2, U+20C3, U+20C4");
  });

  it("narrows to the requested currencies", () => {
    expect(signUnicodeRange(["SAR"])).toBe("U+20C1");
    expect(signUnicodeRange(["OMR", "AED"])).toBe("U+20C3, U+20C4");
  });

  it("throws for a currency with no sign", () => {
    expect(() => signUnicodeRange(["KWD"])).toThrow(/no dedicated Unicode sign/);
  });
});

describe("signFontFaceCSS", () => {
  it("emits a scoped @font-face rule", () => {
    const css = signFontFaceCSS({ src: "/fonts/signs.woff2" });
    expect(css).toContain("@font-face {");
    expect(css).toContain('font-family: "Arabicfmt Signs";');
    expect(css).toContain('src: url("/fonts/signs.woff2") format("woff2");');
    expect(css).toContain("font-display: swap;");
    expect(css).toContain("unicode-range: U+20C1, U+20C2, U+20C3, U+20C4;");
    expect(css.trim().endsWith("}")).toBe(true);
  });

  it("scopes to one currency and a custom family", () => {
    const css = signFontFaceCSS({
      src: "/fonts/riyal.woff2",
      family: "Riyal",
      currencies: ["SAR"],
      display: "block",
    });
    expect(css).toContain('font-family: "Riyal";');
    expect(css).toContain("unicode-range: U+20C1;");
    expect(css).toContain("font-display: block;");
    expect(css).not.toContain("U+20C3");
  });

  it("keeps src fallback order and labels each format", () => {
    const css = signFontFaceCSS({
      src: ["/f/signs.woff2", "/f/signs.woff", "/f/signs.ttf"],
    });
    expect(css).toContain('url("/f/signs.woff2") format("woff2")');
    expect(css).toContain('url("/f/signs.woff") format("woff")');
    expect(css).toContain('url("/f/signs.ttf") format("truetype")');
    expect(css.indexOf("woff2")).toBeLessThan(css.indexOf("truetype"));
  });

  it("omits the format hint for an unrecognized extension", () => {
    const css = signFontFaceCSS({ src: "/fonts/signs" });
    expect(css).toContain('src: url("/fonts/signs");');
  });

  it("accepts weight and style descriptors", () => {
    const css = signFontFaceCSS({
      src: "/f.woff2",
      weight: "400 700",
      style: "normal",
    });
    expect(css).toContain("font-weight: 400 700;");
    expect(css).toContain("font-style: normal;");
  });

  it("refuses values that would break out of the rule", () => {
    expect(() =>
      signFontFaceCSS({ src: '/f.woff2"); } body { display: none; } @font-face { src: url("x' }),
    ).toThrow(TypeError);
    expect(() => signFontFaceCSS({ src: "/f.woff2", family: 'A"; }' })).toThrow(
      TypeError,
    );
    expect(() => signFontFaceCSS({ src: "/f.woff2", weight: "400; }" })).toThrow(
      TypeError,
    );
    expect(() => signFontFaceCSS({ src: [] })).toThrow(TypeError);
    expect(() => signFontFaceCSS({ src: "" })).toThrow(TypeError);
  });
});
