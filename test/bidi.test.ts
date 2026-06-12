import { describe, expect, it } from "vitest";

import {
  detectDirection,
  FSI,
  isolate,
  isolateForeign,
  isRTL,
  LRI,
  PDI,
  RLI,
  stripBidi,
  wrapLTR,
  wrapRTL,
} from "../src/bidi/index";

describe("direction detection", () => {
  it("detects Arabic as RTL", () => {
    expect(detectDirection("مرحبا")).toBe("rtl");
    expect(isRTL("مرحبا")).toBe(true);
  });

  it("detects English as LTR", () => {
    expect(detectDirection("hello")).toBe("ltr");
    expect(isRTL("hello")).toBe(false);
  });

  it("treats digit/punctuation-only strings as neutral", () => {
    expect(detectDirection("12 + 34 = 46")).toBe("neutral");
    expect(detectDirection("   ")).toBe("neutral");
  });

  it("uses the first strong character", () => {
    expect(detectDirection("123 مرحبا hello")).toBe("rtl");
    expect(detectDirection("(2024) Hello مرحبا")).toBe("ltr");
  });
});

describe("isolation primitives", () => {
  it("wraps with the right brackets", () => {
    expect(isolate("x")).toBe(`${FSI}x${PDI}`);
    expect(wrapLTR("x")).toBe(`${LRI}x${PDI}`);
    expect(wrapRTL("x")).toBe(`${RLI}x${PDI}`);
  });

  it("stripBidi is the inverse of isolation", () => {
    expect(stripBidi(isolate("abc"))).toBe("abc");
    expect(stripBidi(wrapLTR(wrapRTL("abc")))).toBe("abc");
  });
});

describe("isolateForeign (broken-sentence fix)", () => {
  const sentence = "اتصل على +1 (555) 234-5678 الآن";

  it("adds isolates without changing the visible text content", () => {
    const fixed = isolateForeign(sentence);
    expect(fixed).not.toBe(sentence);
    expect(stripBidi(fixed)).toBe(sentence);
  });

  it("wraps the embedded LTR/number run in an isolate", () => {
    const fixed = isolateForeign(sentence);
    expect(fixed).toContain(LRI);
    expect(fixed).toContain(PDI);
    // The phone number stays contiguous between the isolate brackets.
    const inner = fixed.slice(fixed.indexOf(LRI) + 1, fixed.indexOf(PDI));
    expect(inner).toBe("+1 (555) 234-5678");
  });

  it("isolates an embedded English word", () => {
    const fixed = isolateForeign("استخدم iPhone اليوم");
    expect(stripBidi(fixed)).toBe("استخدم iPhone اليوم");
    expect(fixed).toContain(`${LRI}iPhone${PDI}`);
  });

  it("leaves pure Arabic untouched", () => {
    expect(isolateForeign("مرحبا بالعالم")).toBe("مرحبا بالعالم");
  });
});
