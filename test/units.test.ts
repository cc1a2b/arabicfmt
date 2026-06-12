import { describe, expect, it } from "vitest";
import { formatDuration } from "../src/number/duration";
import { formatFileSize } from "../src/number/filesize";
import { countedNoun } from "../src/number/count";

// ---------------------------------------------------------------------------
// countedNoun (shared agreement engine)
// ---------------------------------------------------------------------------

describe("countedNoun", () => {
  const hour = {
    gender: "female" as const,
    singular: "ساعة",
    dual: "ساعتان",
    plural: "ساعات",
    accusative: "ساعةً",
  };

  it("applies dual/plural/accusative agreement", () => {
    expect(countedNoun(1, hour)).toBe("ساعة واحدة");
    expect(countedNoun(2, hour)).toBe("ساعتان");
    expect(countedNoun(3, hour)).toBe("ثلاث ساعات");
    expect(countedNoun(10, hour)).toBe("عشر ساعات");
    expect(countedNoun(11, hour)).toBe("إحدى عشرة ساعةً");
    expect(countedNoun(100, hour)).toBe("مئة ساعة");
  });
});

// ---------------------------------------------------------------------------
// formatDuration
// ---------------------------------------------------------------------------

describe("formatDuration", () => {
  it("hours and minutes", () => {
    // 7,500,000 ms = 2h 5m
    expect(formatDuration(7_500_000)).toBe("ساعتان وخمس دقائق");
  });

  it("accepts seconds input", () => {
    expect(formatDuration(90, { input: "s" })).toBe(
      "دقيقة واحدة وثلاثون ثانيةً",
    );
  });

  it("respects largest", () => {
    expect(formatDuration(3_600_000, { largest: 1 })).toBe("ساعة واحدة");
    // 1d 2h 3m, largest 2 → only day + hour
    const ms = (86400 + 2 * 3600 + 3 * 60) * 1000;
    expect(formatDuration(ms, { largest: 2 })).toBe("يوم واحد وساعتان");
  });

  it("single unit", () => {
    expect(formatDuration(5000)).toBe("خمس ثوانٍ");
    expect(formatDuration(2 * 86400_000)).toBe("يومان");
  });

  it("sub-second", () => {
    expect(formatDuration(500)).toBe("أقل من ثانية");
    expect(formatDuration(0)).toBe("أقل من ثانية");
  });

  it("can restrict units", () => {
    // 125 minutes, but only allow minutes → "مئة وخمس وعشرون دقيقةً"
    expect(
      formatDuration(125 * 60_000, { units: ["minute"], largest: 1 }),
    ).toBe("مئة وخمس وعشرون دقيقةً");
  });
});

// ---------------------------------------------------------------------------
// formatFileSize
// ---------------------------------------------------------------------------

describe("formatFileSize", () => {
  it("zero and bytes", () => {
    expect(formatFileSize(0)).toBe("0 بايت");
    expect(formatFileSize(512)).toBe("512 بايت");
  });

  it("scales to KB/MB (binary base by default)", () => {
    expect(formatFileSize(1536)).toBe("1.5 كيلوبايت");
    expect(formatFileSize(5 * 1024 * 1024)).toBe("5 ميجابايت");
  });

  it("decimal base", () => {
    expect(formatFileSize(1_500_000, { base: 1000 })).toBe("1.5 ميجابايت");
  });

  it("eastern arabic numerals", () => {
    expect(formatFileSize(2048, { numerals: "arab" })).toBe("٢ كيلوبايت");
  });

  it("latin unit style", () => {
    expect(formatFileSize(2048, { unitStyle: "latin" })).toBe("2 KB");
  });

  it("negative", () => {
    expect(formatFileSize(-2048)).toBe("-2 كيلوبايت");
  });

  it("precision option", () => {
    expect(formatFileSize(1_400_000, { base: 1000, precision: 2 })).toBe(
      "1.4 ميجابايت",
    );
  });
});
