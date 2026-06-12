/**
 * Saudi national ID / Iqama validation.
 *
 * A Saudi ID is 10 digits whose leading digit encodes the holder type
 * (1 = citizen / national ID, 2 = resident / Iqama) and whose final digit is a
 * Luhn (ISO 7064 mod-10) check digit computed left-to-right over all ten digits.
 */

export type SaudiIdType = "citizen" | "resident";

/** Luhn (from the left) over all ten digits; valid when the total ≡ 0 (mod 10). */
function luhnOk(id: string): boolean {
  let sum = 0;
  for (let i = 0; i < 10; i++) {
    let d = id.charCodeAt(i) - 48;
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return sum % 10 === 0;
}

/**
 * Validate a Saudi national ID or Iqama number (10 digits, leading 1 or 2,
 * correct Luhn check digit).
 *
 * @example isValidSaudiId("1012345672") // true  (citizen)
 * @example isValidSaudiId("2100000005") // true  (resident / Iqama)
 * @example isValidSaudiId("1012345671") // false (bad check digit)
 */
export function isValidSaudiId(id: string): boolean {
  const s = id.trim();
  if (!/^[12][0-9]{9}$/.test(s)) return false;
  return luhnOk(s);
}

/**
 * Holder type from the leading digit, or `null` when the ID is invalid.
 *
 * @example saudiIdType("1012345672") // "citizen"
 * @example saudiIdType("2100000005") // "resident"
 */
export function saudiIdType(id: string): SaudiIdType | null {
  if (!isValidSaudiId(id)) return null;
  return id.trim()[0] === "1" ? "citizen" : "resident";
}
