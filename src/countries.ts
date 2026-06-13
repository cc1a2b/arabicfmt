import { currencyForRegion } from "./currency/data";

export interface ArabLeagueCountry {
  /** ISO 3166-1 alpha-2 region code. */
  readonly region: string;
  /** English country name. */
  readonly nameEn: string;
  /** Arabic country name. */
  readonly nameAr: string;
}

/**
 * The 22 member states of the Arab League. Each country's primary currency is
 * resolved from CLDR via {@link countryCurrency} rather than stored here, so the
 * currency mapping has a single, verifiable source of truth.
 */
export const ARAB_LEAGUE_COUNTRIES: readonly ArabLeagueCountry[] = [
  { region: "SA", nameEn: "Saudi Arabia", nameAr: "السعودية" },
  { region: "AE", nameEn: "United Arab Emirates", nameAr: "الإمارات" },
  { region: "KW", nameEn: "Kuwait", nameAr: "الكويت" },
  { region: "BH", nameEn: "Bahrain", nameAr: "البحرين" },
  { region: "OM", nameEn: "Oman", nameAr: "عُمان" },
  { region: "QA", nameEn: "Qatar", nameAr: "قطر" },
  { region: "JO", nameEn: "Jordan", nameAr: "الأردن" },
  { region: "IQ", nameEn: "Iraq", nameAr: "العراق" },
  { region: "LY", nameEn: "Libya", nameAr: "ليبيا" },
  { region: "TN", nameEn: "Tunisia", nameAr: "تونس" },
  { region: "EG", nameEn: "Egypt", nameAr: "مصر" },
  { region: "LB", nameEn: "Lebanon", nameAr: "لبنان" },
  { region: "SY", nameEn: "Syria", nameAr: "سوريا" },
  { region: "MA", nameEn: "Morocco", nameAr: "المغرب" },
  { region: "DZ", nameEn: "Algeria", nameAr: "الجزائر" },
  { region: "SD", nameEn: "Sudan", nameAr: "السودان" },
  { region: "YE", nameEn: "Yemen", nameAr: "اليمن" },
  { region: "PS", nameEn: "Palestine", nameAr: "فلسطين" },
  { region: "MR", nameEn: "Mauritania", nameAr: "موريتانيا" },
  { region: "SO", nameEn: "Somalia", nameAr: "الصومال" },
  { region: "DJ", nameEn: "Djibouti", nameAr: "جيبوتي" },
  { region: "KM", nameEn: "Comoros", nameAr: "جزر القمر" },
];

/** Primary currency for an Arab League country (or any region), per CLDR. */
export function countryCurrency(region: string): string | undefined {
  return currencyForRegion(region);
}
