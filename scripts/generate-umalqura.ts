/**
 * Generates `src/umalqura/table.generated.ts`.
 *
 * The accurate Umm al-Qura calendar (the official civil calendar of Saudi
 * Arabia) is hard to reproduce from a formula. Node ships full ICU, which
 * contains the authoritative Umm al-Qura month tables, so at build time we walk
 * the `islamic-umalqura` calendar day by day and freeze the month lengths into a
 * compact table. Runtime conversion then reads that table and never touches
 * `Intl` — which is exactly the point, since Intl's Hijri output is famously
 * inconsistent across engines (Node vs. browsers vs. React Native/Hermes).
 *
 * Run with: npm run generate
 */
import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const here = dirname(fileURLToPath(import.meta.url));

// ICU's Umm al-Qura tables are authoritative for roughly AH 1300–1600.
const FIRST_YEAR = 1300;
const LAST_YEAR = 1599;

const fmt = new Intl.DateTimeFormat("en-u-ca-islamic-umalqura-nu-latn", {
  year: "numeric",
  month: "numeric",
  day: "numeric",
  timeZone: "UTC",
});

function hijriOf(date: Date): { y: number; m: number; d: number } {
  const parts = fmt.formatToParts(date);
  let y = 0,
    m = 0,
    d = 0;
  for (const p of parts) {
    if (p.type === "year") y = parseInt(p.value, 10);
    else if (p.type === "month") m = parseInt(p.value, 10);
    else if (p.type === "day") d = parseInt(p.value, 10);
  }
  return { y, m, d };
}

const DAY_MS = 86_400_000;

// Walk from well before 1 Muharram FIRST_YEAR up to 1 Muharram (LAST_YEAR+1).
// Record the Gregorian date that starts each Hijri month, then diff to lengths.
const monthStart = new Map<string, Date>(); // "y-m" -> Gregorian date of day 1
let cursor = Date.UTC(1880, 0, 1); // 1880-01-01, safely before AH 1300
const end = Date.UTC(2178, 0, 1); // safely after AH 1600

let prevKey = "";
while (cursor < end) {
  const date = new Date(cursor);
  const { y, m, d } = hijriOf(date);
  if (y >= FIRST_YEAR && y <= LAST_YEAR + 1) {
    const key = `${y}-${m}`;
    if (key !== prevKey && d === 1 && !monthStart.has(key)) {
      monthStart.set(key, date);
    }
    prevKey = key;
  }
  cursor += DAY_MS;
}

function startOf(y: number, m: number): Date {
  const date = monthStart.get(`${y}-${m}`);
  if (!date) throw new Error(`Missing Umm al-Qura month start for ${y}-${m}`);
  return date;
}

// Epoch = Gregorian date of 1 Muharram FIRST_YEAR.
const epoch = startOf(FIRST_YEAR, 1);
const EPOCH_GREGORIAN: [number, number, number] = [
  epoch.getUTCFullYear(),
  epoch.getUTCMonth() + 1,
  epoch.getUTCDate(),
];

// Pack each year as 12 bits: bit (m-1) set => month m has 30 days, else 29.
const bits: number[] = [];
for (let y = FIRST_YEAR; y <= LAST_YEAR; y++) {
  let yearBits = 0;
  for (let m = 1; m <= 12; m++) {
    const thisStart = startOf(y, m).getTime();
    const nextStart =
      m === 12 ? startOf(y + 1, 1).getTime() : startOf(y, m + 1).getTime();
    const length = Math.round((nextStart - thisStart) / DAY_MS);
    if (length !== 29 && length !== 30) {
      throw new Error(`Unexpected month length ${length} for ${y}-${m}`);
    }
    if (length === 30) yearBits |= 1 << (m - 1);
  }
  bits.push(yearBits);
}

// Sanity: total span should match day count between epoch and last month end.
const totalDays = bits.reduce(
  (sum, yb) => sum + 12 * 29 + popcount(yb),
  0,
);
function popcount(n: number): number {
  let c = 0;
  while (n) {
    c += n & 1;
    n >>>= 1;
  }
  return c;
}

const rows = bits.map((b) => `0x${b.toString(16).padStart(3, "0")}`);
const grouped: string[] = [];
for (let i = 0; i < rows.length; i += 12) {
  grouped.push("  " + rows.slice(i, i + 12).join(", ") + ",");
}

const out = `// AUTO-GENERATED FILE — DO NOT EDIT BY HAND.
// Source: Node.js full-ICU "islamic-umalqura" calendar.
// Regenerate with: npm run generate
//
// Authoritative range: AH ${FIRST_YEAR}–${LAST_YEAR} (Gregorian ~${EPOCH_GREGORIAN[0]}–${EPOCH_GREGORIAN[0] + Math.ceil((LAST_YEAR - FIRST_YEAR) * 0.97)}).
// Each entry packs one Hijri year: bit (month-1) set => that month has 30 days.

/** First Hijri year covered by the table. */
export const FIRST_YEAR = ${FIRST_YEAR};

/** Last Hijri year covered by the table. */
export const LAST_YEAR = ${LAST_YEAR};

/** Proleptic Gregorian [year, month, day] of 1 Muharram ${FIRST_YEAR} AH. */
export const EPOCH_GREGORIAN: readonly [number, number, number] = [${EPOCH_GREGORIAN.join(", ")}];

/** Total days spanned by the table (${FIRST_YEAR}-01-01 .. ${LAST_YEAR}-12-end). */
export const TOTAL_DAYS = ${totalDays};

/** Packed month-length bitmasks, one per Hijri year starting at FIRST_YEAR. */
export const MONTH_LENGTH_BITS: readonly number[] = [
${grouped.join("\n")}
];
`;

const target = resolve(here, "../src/umalqura/table.generated.ts");
writeFileSync(target, out, "utf8");

console.log(
  `Wrote ${target}\n  AH ${FIRST_YEAR}–${LAST_YEAR}: ${bits.length} years, epoch ${EPOCH_GREGORIAN.join("-")}, ${totalDays} days.`,
);
