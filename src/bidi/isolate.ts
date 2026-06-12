import type { Direction } from "../types";
import { charDirection, detectDirection } from "./direction";

// Defined via char codes (not literals) so these invisible control characters
// stay unambiguous and reviewable in source.
const cc = String.fromCharCode;

/** Left-to-Right Isolate (U+2066). */
export const LRI = cc(0x2066);
/** Right-to-Left Isolate (U+2067). */
export const RLI = cc(0x2067);
/** First Strong Isolate (U+2068). */
export const FSI = cc(0x2068);
/** Pop Directional Isolate (U+2069). */
export const PDI = cc(0x2069);
/** Left-to-Right Mark (U+200E). */
export const LRM = cc(0x200e);
/** Right-to-Left Mark (U+200F). */
export const RLM = cc(0x200f);
/** Arabic Letter Mark (U+061C). */
export const ALM = cc(0x061c);

// Marks (200E/200F/061C), legacy embeddings/overrides (202A–202E), isolates (2066–2069).
const BIDI_CONTROLS = new RegExp(
  `[${cc(0x200e)}${cc(0x200f)}${cc(0x061c)}${cc(0x202a)}-${cc(0x202e)}${cc(0x2066)}-${cc(0x2069)}]`,
  "g",
);

/** Direction hint for {@link isolate}: pick the bracket, or let it auto-detect. */
export type IsolateDirection = "auto" | "ltr" | "rtl";

/**
 * Wrap `text` in a Unicode directional isolate so it composes safely inside
 * surrounding text of either direction. Defaults to a First Strong Isolate
 * (FSI), which adopts the text's own detected direction.
 */
export function isolate(text: string, dir: IsolateDirection = "auto"): string {
  const open = dir === "ltr" ? LRI : dir === "rtl" ? RLI : FSI;
  return open + text + PDI;
}

/** Wrap `text` as a left-to-right isolate (LRI … PDI). */
export function wrapLTR(text: string): string {
  return isolate(text, "ltr");
}

/** Wrap `text` as a right-to-left isolate (RLI … PDI). */
export function wrapRTL(text: string): string {
  return isolate(text, "rtl");
}

/** Remove every Unicode bidi control character (marks, embeddings, isolates). */
export function stripBidi(text: string): string {
  return text.replace(BIDI_CONTROLS, "");
}

export interface IsolateForeignOptions {
  /** Base direction of the surrounding text. Defaults to the detected base. */
  base?: Direction;
  /** Also isolate runs of Western digits (phone numbers, codes). Default true. */
  numbers?: boolean;
}

const ASCII_DIGIT = /[0-9]/;

/**
 * Fix the "broken sentence" problem: wrap each run of opposite-direction content
 * (English words, phone numbers, emails, URLs) embedded in `text` with an
 * isolate, so it keeps its internal order without reordering the rest.
 *
 * @example
 * isolateForeign("اتصل على +1 (555) 234-5678 الآن")
 * // the phone number is wrapped in FSI … PDI and no longer flips the sentence
 */
export function isolateForeign(
  text: string,
  options: IsolateForeignOptions = {},
): string {
  const base = options.base ?? (detectDirection(text) === "ltr" ? "ltr" : "rtl");
  const wrapDir: IsolateDirection = base === "ltr" ? "rtl" : "ltr";
  const includeNumbers = options.numbers ?? true;

  let result = "";
  let run = "";
  let runHasOpposite = false;

  const flush = (): void => {
    if (!run) return;
    if (runHasOpposite) {
      const lead = run.match(/^\s*/)![0];
      const trail = run.match(/\s*$/)![0];
      const core = run.slice(lead.length, run.length - trail.length);
      result += lead + isolate(core, wrapDir) + trail;
    } else {
      result += run;
    }
    run = "";
    runHasOpposite = false;
  };

  for (const ch of text) {
    const dir = charDirection(ch);
    if (dir === base) {
      flush();
      result += ch;
    } else {
      run += ch;
      if ((dir !== "neutral" && dir !== base) || (includeNumbers && ASCII_DIGIT.test(ch))) {
        runHasOpposite = true;
      }
    }
  }
  flush();
  return result;
}
