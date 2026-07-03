export {
  normalizeAlef,
  normalizeAlefMaksura,
  normalizeArabic,
  normalizeForSearch,
  normalizeTaaMarbuta,
  removeTatweel,
  stripTashkeel,
} from "./normalize";
export type { NormalizeOptions } from "./normalize";

export { arabicPluralForm, arabicPlural } from "./plural";
export type { ArabicPluralForm, ArabicPluralForms } from "./plural";

export { compareArabic, createArabicCollator, sortArabic } from "./collation";

export { formatList } from "./list";
export type { FormatListOptions } from "./list";

export { transliterate, slugify } from "./transliterate";
export type { SlugifyOptions } from "./transliterate";
