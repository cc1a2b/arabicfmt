/**
 * Digit shaping system: Western (`latn`, 0-9), Eastern Arabic (`arab`, ٠-٩) as
 * used across the Arab world, or Extended Arabic-Indic (`arabext`, ۰-۹) as used
 * in Persian and Urdu typography.
 */
export type NumeralSystem = "latn" | "arab" | "arabext";

/** Resolved text direction. */
export type Direction = "rtl" | "ltr" | "neutral";
