import { describe, expect, it } from "vitest";

import {
  ARAB_LEAGUE_COUNTRIES,
  countryCurrency,
  CURRENCY_SYMBOLS,
  currencyDigits,
  formatCurrency,
  getCurrencyInfo,
  LEGACY_RIAL_LIGATURE,
  resolveCurrencySymbol,
} from "../src/currency/index";

const SAR_SIGN = String.fromCodePoint(0x20c1);
const AED_SIGN = String.fromCodePoint(0x20c3);
const OMR_SIGN = String.fromCodePoint(0x20c4);

describe("currency precision", () => {
  it("uses 3 decimals for every dinar currency", () => {
    for (const code of ["KWD", "BHD", "OMR", "JOD", "IQD", "LYD", "TND"]) {
      expect(currencyDigits(code), code).toBe(3);
    }
  });

  it("keeps IQD at 3 decimals despite CLDR's 0 (ISO 4217 override)", () => {
    expect(currencyDigits("IQD")).toBe(3);
    expect(formatCurrency(1.2, { currency: "IQD" })).toContain("1.200");
  });

  it("uses 0 decimals for franc currencies", () => {
    expect(currencyDigits("DJF")).toBe(0);
    expect(currencyDigits("KMF")).toBe(0);
    expect(formatCurrency(1234.5, { currency: "KMF" })).toContain("1,235");
  });

  it("defaults to 2 decimals", () => {
    expect(currencyDigits("SAR")).toBe(2);
    expect(currencyDigits("USD")).toBe(2);
  });
});

describe("Saudi riyal symbol transition", () => {
  it("auto mode renders the safe text symbol", () => {
    expect(resolveCurrencySymbol("SAR", { mode: "auto" })).toBe(
      CURRENCY_SYMBOLS.SAR!.text,
    );
  });

  it("new mode renders exactly U+20C1", () => {
    const sign = resolveCurrencySymbol("SAR", { mode: "new" });
    expect(sign).toBe(SAR_SIGN);
    expect(sign.codePointAt(0)).toBe(0x20c1);
  });

  it("code mode renders the ISO code", () => {
    expect(resolveCurrencySymbol("SAR", { mode: "code" })).toBe("SAR");
  });

  it("never uses the legacy Iranian-rial ligature U+FDFC", () => {
    expect(LEGACY_RIAL_LIGATURE.codePointAt(0)).toBe(0xfdfc);
    for (const data of Object.values(CURRENCY_SYMBOLS)) {
      expect(data.text.includes(LEGACY_RIAL_LIGATURE), data.code).toBe(false);
      if (data.unicode) {
        expect(data.unicode.char).not.toBe(LEGACY_RIAL_LIGATURE);
      }
    }
  });

  it("reports U+20C1 as live since Unicode 17.0", () => {
    const info = getCurrencyInfo("SAR");
    expect(info.unicode?.codepoint).toBe("U+20C1");
    expect(info.unicode?.unicodeVersion).toBe("17.0");
    expect(info.unicode?.live).toBe(true);
  });
});

describe("AED / OMR transition complete (Unicode 18.0 — v2.0.0)", () => {
  it("auto now renders the dedicated Unicode sign", () => {
    expect(resolveCurrencySymbol("AED", { mode: "auto" })).toBe(AED_SIGN);
    expect(resolveCurrencySymbol("OMR", { mode: "auto" })).toBe(OMR_SIGN);
  });

  it("text mode still renders the legacy-safe symbol", () => {
    expect(resolveCurrencySymbol("AED", { mode: "text" })).toBe(
      CURRENCY_SYMBOLS.AED!.text,
    );
    expect(resolveCurrencySymbol("OMR", { mode: "text" })).toBe(
      CURRENCY_SYMBOLS.OMR!.text,
    );
  });

  it("exposes the codepoints through new mode", () => {
    expect(resolveCurrencySymbol("AED", { mode: "new" })).toBe(AED_SIGN);
    expect(resolveCurrencySymbol("OMR", { mode: "new" })).toBe(OMR_SIGN);
  });

  it("marks the AED/OMR signs live since Unicode 18.0", () => {
    expect(getCurrencyInfo("AED").unicode?.live).toBe(true);
    expect(getCurrencyInfo("OMR").unicode?.live).toBe(true);
    expect(getCurrencyInfo("AED").unicode?.autoDefault).toBe(true);
    expect(getCurrencyInfo("AED").unicode?.unicodeVersion).toBe("18.0");
  });
});

describe("SAR stays conservative (text default)", () => {
  it("SAR auto remains the safe text symbol", () => {
    expect(resolveCurrencySymbol("SAR", { mode: "auto" })).toBe(
      CURRENCY_SYMBOLS.SAR!.text,
    );
    expect(getCurrencyInfo("SAR").unicode?.autoDefault).toBe(false);
  });
});

describe("formatCurrency", () => {
  it("formats SAR with the text symbol and 2 decimals", () => {
    const out = formatCurrency(1234.5, { currency: "SAR" });
    expect(out).toContain("1,234.50");
    expect(out).toContain(CURRENCY_SYMBOLS.SAR!.text);
  });

  it("resolves the currency from the locale's region", () => {
    const out = formatCurrency(10, { locale: "ar-KW" });
    expect(out).toContain("10.000"); // KWD → 3 decimals
    expect(out).toContain(CURRENCY_SYMBOLS.KWD!.text);
  });

  it("keeps Western numerals by default and converts on request", () => {
    expect(formatCurrency(1234.5, { currency: "SAR" })).toMatch(/[0-9]/);
    const arab = formatCurrency(1234.5, { currency: "SAR", numerals: "arab" });
    expect(arab).not.toMatch(/[0-9]/);
  });

  it("can render the ISO code instead of a symbol", () => {
    expect(formatCurrency(5, { currency: "SAR", symbolMode: "code" })).toContain(
      "SAR",
    );
  });

  it("throws a helpful error when no currency can be resolved", () => {
    expect(() => formatCurrency(10, { locale: "ar" })).toThrow(
      /could not resolve a currency/,
    );
  });
});

describe("Arab League coverage", () => {
  it("covers 22 countries, each with a curated currency symbol", () => {
    expect(ARAB_LEAGUE_COUNTRIES).toHaveLength(22);
    for (const country of ARAB_LEAGUE_COUNTRIES) {
      const currency = countryCurrency(country.region);
      expect(currency, country.region).toBeTruthy();
      expect(CURRENCY_SYMBOLS[currency!], currency).toBeTruthy();
    }
  });
});
