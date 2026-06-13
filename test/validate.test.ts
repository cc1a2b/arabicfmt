import { describe, expect, it } from "vitest";
import {
  isValidIBAN,
  formatIBAN,
  normalizeIBAN,
} from "../src/validate/iban";
import { isValidSaudiId, saudiIdType } from "../src/validate/saudi-id";

// ---------------------------------------------------------------------------
// IBAN
// ---------------------------------------------------------------------------

describe("isValidIBAN", () => {
  it("accepts valid published example IBANs", () => {
    // Registry example IBANs — valid checksum, not real accounts.
    expect(isValidIBAN("SA03 8000 0000 6080 1016 7519")).toBe(true);
    expect(isValidIBAN("KW81 CBKU 0000 0000 0000 1234 5601 01")).toBe(true);
    expect(isValidIBAN("AE07 0331 2345 6789 0123 456")).toBe(true);
    expect(isValidIBAN("BH67 BMAG 0000 1299 1234 56")).toBe(true);
    expect(isValidIBAN("JO94 CBJO 0010 0000 0000 0131 0003 02")).toBe(true);
  });

  it("rejects a tampered checksum", () => {
    expect(isValidIBAN("SA03 8000 0000 6080 1016 7510")).toBe(false);
  });

  it("rejects wrong length for a known country", () => {
    expect(isValidIBAN("SA03 8000 0000 6080 1016 75")).toBe(false);
  });

  it("rejects malformed structure", () => {
    expect(isValidIBAN("")).toBe(false);
    expect(isValidIBAN("ABCD")).toBe(false);
    expect(isValidIBAN("12SA000000")).toBe(false);
  });

  it("is whitespace- and case-insensitive", () => {
    expect(isValidIBAN("sa0380000000608010167519")).toBe(true);
  });
});

describe("formatIBAN / normalizeIBAN", () => {
  it("groups in fours", () => {
    expect(formatIBAN("SA0380000000608010167519")).toBe(
      "SA03 8000 0000 6080 1016 7519",
    );
  });

  it("custom separator", () => {
    expect(formatIBAN("AE070331234567890123456", { separator: "-" })).toBe(
      "AE07-0331-2345-6789-0123-456",
    );
  });

  it("normalizes to electronic form", () => {
    expect(normalizeIBAN("sa03 8000 0000")).toBe("SA0380000000");
  });
});

// ---------------------------------------------------------------------------
// Saudi national ID / Iqama
// ---------------------------------------------------------------------------

describe("isValidSaudiId", () => {
  it("accepts valid citizen and resident IDs", () => {
    expect(isValidSaudiId("1012345672")).toBe(true); // citizen
    expect(isValidSaudiId("2100000005")).toBe(true); // resident
  });

  it("rejects a bad check digit", () => {
    expect(isValidSaudiId("1012345671")).toBe(false);
  });

  it("rejects wrong length or leading digit", () => {
    expect(isValidSaudiId("101234567")).toBe(false); // 9 digits
    expect(isValidSaudiId("3012345670")).toBe(false); // leading 3
    expect(isValidSaudiId("abcdefghij")).toBe(false);
  });

  it("tolerates surrounding whitespace", () => {
    expect(isValidSaudiId("  1012345672  ")).toBe(true);
  });
});

describe("saudiIdType", () => {
  it("classifies by leading digit", () => {
    expect(saudiIdType("1012345672")).toBe("citizen");
    expect(saudiIdType("2100000005")).toBe("resident");
  });

  it("returns null for invalid IDs", () => {
    expect(saudiIdType("1012345671")).toBeNull();
  });
});
