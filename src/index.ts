/**
 * arabicfmt — Arabic-first formatting for numbers, currency, dates and
 * bidirectional text across the 22 Arab League countries.
 *
 * The accurate Umm al-Qura calendar ships separately as `arabicfmt/umalqura`
 * so the core stays tiny; everything else is re-exported here.
 */
export * from "./currency/index";
export * from "./number/index";
export * from "./date/index";
export * from "./bidi/index";
export * from "./text/index";
export * from "./validate/index";

export { DEFAULT_LOCALE, regionFromLocale, detectLocale } from "./locale";
export type { Direction, NumeralSystem } from "./types";
