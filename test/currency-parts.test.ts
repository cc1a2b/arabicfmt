import { describe, expect, it } from "vitest";

import {
  formatCurrency,
  formatCurrencyRange,
  formatCurrencyToParts,
  type FormatCurrencyOptions,
} from "../src/currency/index";
import { FSI, PDI } from "../src/bidi/index";

const SAR_SIGN = String.fromCodePoint(0x20c1);
/** Collapse the non-breaking space Intl inserts, so assertions stay readable. */
const plain = (s: string) => s.replace(/\u00a0/g, " ");

describe("formatCurrencyToParts", () => {
  it("splits an amount into number parts plus exactly one symbol", () => {
    const parts = formatCurrencyToParts(1234.5, { currency: "SAR" });
    expect(
      parts
        .filter((p) => p.type !== "currency" && p.type !== "literal")
        .map((p) => p.type),
    ).toEqual(["integer", "group", "integer", "decimal", "fraction"]);
    expect(parts.filter((p) => p.type === "currency")).toHaveLength(1);
    expect(parts.map((p) => p.value).join("")).toBe(
      formatCurrency(1234.5, { currency: "SAR" }),
    );
  });

  it("rebuilds exactly what formatCurrency returns, across the option matrix", () => {
    const cases: [number, FormatCurrencyOptions][] = [
      [1234.5, { currency: "SAR" }],
      [1234.5, { currency: "SAR", numerals: "arab" }],
      [1234.5, { currency: "SAR", numerals: "arabext" }],
      [1.2, { currency: "KWD" }],
      [500, { currency: "KMF" }],
      [-1234.5, { currency: "SAR", accounting: true }],
      [-1234.5, { currency: "SAR" }],
      [0, { currency: "AED", symbolMode: "new" }],
      [99.9, { locale: "ar-BH" }],
      [99.9, { locale: "en-US", currency: "USD" }],
      [10, { currency: "SAR", showSymbol: false }],
      [10, { currency: "SAR", isolate: true }],
      [10, { currency: "SAR", symbolPosition: "before", symbolSpacing: "" }],
      [10, { currency: "SAR", signDisplay: "always" }],
      [1234.5, { currency: "MVR", symbolMode: "code" }],
    ];
    for (const [amount, options] of cases) {
      const label = `${amount} ${JSON.stringify(options)}`;
      expect(
        formatCurrencyToParts(amount, options)
          .map((p) => p.value)
          .join(""),
        label,
      ).toBe(formatCurrency(amount, options));
    }
  });

  it("never emits an empty part", () => {
    for (const options of [
      { currency: "SAR" },
      { currency: "SAR", symbolSpacing: "" },
      { locale: "en-US", currency: "USD" },
    ]) {
      for (const part of formatCurrencyToParts(42, options)) {
        expect(part.value.length, JSON.stringify(options)).toBeGreaterThan(0);
      }
    }
  });

  it("marks a dedicated Unicode sign with its codepoint", () => {
    const part = formatCurrencyToParts(10, {
      currency: "SAR",
      symbolMode: "new",
    }).find((p) => p.type === "currency");
    expect(part?.value).toBe(SAR_SIGN);
    expect(part?.codepoint).toBe("U+20C1");
    expect(part?.needsFont).toBe(true);
    expect(part?.symbolMode).toBe("new");
  });

  it("marks the AED sign under auto, since Unicode 18.0 made it the default", () => {
    const part = formatCurrencyToParts(10, { currency: "AED" }).find(
      (p) => p.type === "currency",
    );
    expect(part?.codepoint).toBe("U+20C3");
    expect(part?.needsFont).toBe(true);
  });

  it("leaves text and code symbols free of font requirements", () => {
    for (const mode of ["text", "code"] as const) {
      const part = formatCurrencyToParts(10, {
        currency: "SAR",
        symbolMode: mode,
      }).find((p) => p.type === "currency");
      expect(part?.needsFont, mode).toBe(false);
      expect(part?.codepoint, mode).toBeUndefined();
    }
  });

  it("brackets accounting negatives as parenthesis parts", () => {
    const parts = formatCurrencyToParts(-1234.5, {
      currency: "SAR",
      accounting: true,
    });
    expect(parts[0]).toMatchObject({ type: "parenthesis", value: "(" });
    expect(parts[parts.length - 1]).toMatchObject({
      type: "parenthesis",
      value: ")",
    });
    expect(parts.some((p) => p.type === "minusSign")).toBe(false);
  });

  it("exposes isolate controls as their own parts", () => {
    const parts = formatCurrencyToParts(10, { currency: "SAR", isolate: true });
    expect(parts[0]).toEqual({ type: "isolate", value: FSI });
    expect(parts[parts.length - 1]).toEqual({ type: "isolate", value: PDI });
  });

  it("omits the currency part when the symbol is hidden", () => {
    const parts = formatCurrencyToParts(10, {
      currency: "SAR",
      showSymbol: false,
    });
    expect(parts.some((p) => p.type === "currency")).toBe(false);
  });

  it("shapes digits inside the parts, not around them", () => {
    const parts = formatCurrencyToParts(1234.5, {
      currency: "SAR",
      numerals: "arab",
    });
    const digits = parts
      .filter((p) => p.type === "integer" || p.type === "fraction")
      .map((p) => p.value)
      .join("");
    expect(digits).not.toMatch(/[0-9]/);
    expect(digits).toMatch(/[٠-٩]/);
  });
});

describe("accounting negatives keep their sign without a symbol", () => {
  // Before 0.1.5 this returned "5.00" — the amount silently lost its negativity.
  it("parenthesizes even when showSymbol is false", () => {
    expect(
      formatCurrency(-5, {
        currency: "SAR",
        accounting: true,
        showSymbol: false,
      }),
    ).toBe("(5.00)");
  });
});

describe("formatCurrencyRange", () => {
  it("shows the symbol once by default", () => {
    expect(plain(formatCurrencyRange(1000, 5000, { currency: "SAR" }))).toBe(
      "1,000.00 – 5,000.00 ر.س",
    );
  });

  it("can repeat the symbol on both ends", () => {
    expect(
      plain(
        formatCurrencyRange(1000, 5000, { currency: "SAR", symbolEach: true }),
      ),
    ).toBe("1,000.00 ر.س – 5,000.00 ر.س");
  });

  it("shares one precision across both ends", () => {
    expect(plain(formatCurrencyRange(1.2, 2, { currency: "KWD" }))).toBe(
      "1.200 – 2.000 د.ك",
    );
  });

  it("collapses an empty range to a single amount", () => {
    expect(formatCurrencyRange(50, 50, { currency: "SAR" })).toBe(
      formatCurrency(50, { currency: "SAR" }),
    );
  });

  it("takes a custom separator", () => {
    expect(
      plain(
        formatCurrencyRange(10, 20, {
          currency: "SAR",
          rangeSeparator: " إلى ",
        }),
      ),
    ).toBe("10.00 إلى 20.00 ر.س");
  });

  it("honours numerals, symbol mode and hidden symbols", () => {
    const arab = formatCurrencyRange(10, 20, {
      currency: "SAR",
      numerals: "arab",
    });
    expect(arab).not.toMatch(/[0-9]/);

    expect(
      plain(
        formatCurrencyRange(10, 20, { currency: "SAR", symbolMode: "code" }),
      ),
    ).toBe("10.00 – 20.00 SAR");

    expect(
      plain(
        formatCurrencyRange(10, 20, { currency: "SAR", showSymbol: false }),
      ),
    ).toBe("10.00 – 20.00");
  });

  it("wraps the whole range in an isolate on request", () => {
    const out = formatCurrencyRange(10, 20, { currency: "SAR", isolate: true });
    expect(out.startsWith(FSI)).toBe(true);
    expect(out.endsWith(PDI)).toBe(true);
  });

  it("parenthesizes each negative end in accounting mode", () => {
    expect(
      plain(
        formatCurrencyRange(-500, -100, { currency: "SAR", accounting: true }),
      ),
    ).toBe("(500.00) – (100.00) ر.س");
  });

  it("rejects a reversed or non-finite range", () => {
    expect(() => formatCurrencyRange(500, 100, { currency: "SAR" })).toThrow(
      /reversed range/,
    );
    expect(() => formatCurrencyRange(NaN, 100, { currency: "SAR" })).toThrow(
      RangeError,
    );
    expect(() =>
      formatCurrencyRange(0, Infinity, { currency: "SAR" }),
    ).toThrow(RangeError);
  });

  it("still requires a resolvable currency", () => {
    expect(() => formatCurrencyRange(1, 2, { locale: "ar" })).toThrow(
      /could not resolve a currency/,
    );
  });
});
