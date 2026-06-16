// Tool definitions and handlers for the arabicfmt MCP server.
//
// Each entry maps an MCP tool name to:
//   - description: human/agent-readable summary
//   - inputSchema: a Zod raw shape (plain object of Zod validators) consumed
//     by McpServer.registerTool, which converts it to a JSON Schema for clients
//   - handler:    an async function (args) => string, calling the matching
//     arabicfmt function and returning its string result
//
// The handlers are exported separately so they can be unit-tested without a
// running MCP server. index.js wires each into McpServer.registerTool and
// wraps the string result in MCP text content.

import { z } from 'zod';
import {
  formatCurrency,
  spellCurrency,
  formatHijri,
  toHijri,
  arabicToWords,
  arabicOrdinal,
  formatNumber,
  formatCompact,
  parseNumber,
  formatDuration,
  formatRelativeTime,
  arabicPlural,
  isolateForeign,
  transliterate,
  slugify,
  isValidIBAN,
  isValidSaudiId,
} from 'arabicfmt';

// Shared option pieces ------------------------------------------------------

const localeOpt = z
  .string()
  .optional()
  .describe("BCP-47 locale, e.g. 'ar', 'ar-SA', 'en'. Defaults to 'ar'.");

const numeralsOpt = z
  .enum(['latn', 'arab', 'arabext'])
  .optional()
  .describe(
    "Numeral system: 'latn' (1234), 'arab' (Eastern Arabic ١٢٣٤), or 'arabext' (Persian/Urdu ۱۲۳۴)."
  );

// Coerce an incoming ISO 8601 string (or epoch ms) into a Date.
function toDate(value, field) {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) {
    throw new Error(`Invalid date for "${field}": ${JSON.stringify(value)}`);
  }
  return d;
}

// Tool table ----------------------------------------------------------------

export const tools = {
  format_currency: {
    description:
      'Format a number as an Arabic currency amount with the correct symbol, grouping, and decimal precision (e.g. 1234.5 SAR -> "1,234.50 ر.س"). Handles the 2025-2026 Unicode currency-symbol transition (Saudi Riyal U+20C1, etc.).',
    inputSchema: {
      amount: z.number().describe('The monetary amount to format.'),
      currency: z
        .string()
        .optional()
        .describe("ISO 4217 currency code, e.g. 'SAR', 'AED', 'KWD'. Defaults to SAR-area default."),
      locale: localeOpt,
      numerals: numeralsOpt,
    },
    handler: async ({ amount, currency, locale, numerals }) => {
      const options = {};
      if (currency !== undefined) options.currency = currency;
      if (locale !== undefined) options.locale = locale;
      if (numerals !== undefined) options.numerals = numerals;
      return formatCurrency(amount, options);
    },
  },

  spell_currency: {
    description:
      'Spell out a currency amount in full Arabic words, including the major and minor units with correct grammatical agreement (e.g. 1234.5 SAR -> "ألف ومئتان وأربعة وثلاثون ريالاً وخمسون هللة").',
    inputSchema: {
      amount: z.number().describe('The monetary amount to spell out.'),
      currency: z
        .string()
        .optional()
        .describe("ISO 4217 currency code, e.g. 'SAR', 'AED', 'KWD'."),
      locale: localeOpt,
    },
    handler: async ({ amount, currency, locale }) => {
      const options = {};
      if (currency !== undefined) options.currency = currency;
      if (locale !== undefined) options.locale = locale;
      return spellCurrency(amount, options);
    },
  },

  format_hijri: {
    description:
      'Format a Gregorian date as a Hijri (Islamic) date string with Arabic month names and era (e.g. 2025-09-23 -> "٢٣ رمضان ١٤٤٧ هـ").',
    inputSchema: {
      date: z
        .string()
        .describe("Gregorian date as ISO 8601 string, e.g. '2025-09-23' or '2025-09-23T00:00:00Z'."),
      locale: localeOpt,
      numerals: numeralsOpt,
    },
    handler: async ({ date, locale, numerals }) => {
      const options = {};
      if (locale !== undefined) options.locale = locale;
      if (numerals !== undefined) options.numerals = numerals;
      return formatHijri(toDate(date, 'date'), options);
    },
  },

  to_hijri: {
    description:
      'Convert a Gregorian date to its Hijri components. Returns a JSON object string like {"year":1447,"month":9,"day":23}.',
    inputSchema: {
      date: z
        .string()
        .describe("Gregorian date as ISO 8601 string, e.g. '2025-09-23'."),
    },
    handler: async ({ date }) => {
      return JSON.stringify(toHijri(toDate(date, 'date')));
    },
  },

  arabic_to_words: {
    description:
      'Convert an integer to its full Arabic cardinal words (e.g. 1234567 -> "مليون ومئتان وأربعة وثلاثون ألفاً وخمسمئة وسبعة وستون").',
    inputSchema: {
      n: z.number().int().describe('The integer to convert to Arabic words.'),
      feminine: z
        .boolean()
        .optional()
        .describe('Use feminine grammatical gender for the counted noun.'),
    },
    handler: async ({ n, feminine }) => {
      const options = {};
      if (feminine !== undefined) options.feminine = feminine;
      return arabicToWords(n, options);
    },
  },

  arabic_ordinal: {
    description:
      'Convert an integer to its Arabic ordinal words (e.g. 25 -> "الخامس والعشرون").',
    inputSchema: {
      n: z.number().int().describe('The integer to convert to an Arabic ordinal.'),
      feminine: z
        .boolean()
        .optional()
        .describe('Use feminine grammatical gender.'),
    },
    handler: async ({ n, feminine }) => {
      const options = {};
      if (feminine !== undefined) options.feminine = feminine;
      return arabicOrdinal(n, options);
    },
  },

  format_number: {
    description:
      'Format a number with locale-aware grouping, decimal separators, and optional Eastern Arabic numerals (e.g. 1234567.89 with numerals "arab" -> "١٬٢٣٤٬٥٦٧٫٨٩").',
    inputSchema: {
      value: z.number().describe('The number to format.'),
      locale: localeOpt,
      numerals: numeralsOpt,
    },
    handler: async ({ value, locale, numerals }) => {
      const options = {};
      if (locale !== undefined) options.locale = locale;
      if (numerals !== undefined) options.numerals = numerals;
      return formatNumber(value, options);
    },
  },

  format_compact: {
    description:
      'Format a number in compact notation with Arabic scale words (e.g. 1200000 with locale "ar" -> "1.2 مليون").',
    inputSchema: {
      value: z.number().describe('The number to format compactly.'),
      locale: localeOpt,
      numerals: numeralsOpt,
      compactDisplay: z
        .enum(['short', 'long'])
        .optional()
        .describe("Compact form: 'short' or 'long'."),
    },
    handler: async ({ value, locale, numerals, compactDisplay }) => {
      const options = {};
      if (locale !== undefined) options.locale = locale;
      if (numerals !== undefined) options.numerals = numerals;
      if (compactDisplay !== undefined) options.compactDisplay = compactDisplay;
      return formatCompact(value, options);
    },
  },

  parse_number: {
    description:
      'Parse a string containing Latin or Eastern Arabic digits (with Arabic grouping/decimal separators) into a JavaScript number (e.g. "١٬٢٣٤٫٥٦" -> 1234.56). Returns the number as a string.',
    inputSchema: {
      input: z
        .string()
        .describe("The numeric string to parse, e.g. '١٬٢٣٤٫٥٦' or '1,234.56'."),
    },
    handler: async ({ input }) => {
      return String(parseNumber(input));
    },
  },

  format_duration: {
    description:
      'Format a duration in milliseconds as natural Arabic words (e.g. 7500000 -> "ساعتان وخمس دقائق").',
    inputSchema: {
      value: z.number().describe('Duration in milliseconds.'),
      locale: localeOpt,
      numerals: numeralsOpt,
    },
    handler: async ({ value, locale, numerals }) => {
      const options = {};
      if (locale !== undefined) options.locale = locale;
      if (numerals !== undefined) options.numerals = numerals;
      return formatDuration(value, options);
    },
  },

  format_relative_time: {
    description:
      'Format a date relative to a base date in Arabic (e.g. three days ago -> "منذ ٣ أيام"). Defaults the base to now.',
    inputSchema: {
      date: z
        .string()
        .describe("Target date as ISO 8601 string, e.g. '2025-09-20'."),
      base: z
        .string()
        .optional()
        .describe("Base/reference date as ISO 8601 string. Defaults to the current time."),
      locale: localeOpt,
      numerals: numeralsOpt,
    },
    handler: async ({ date, base, locale, numerals }) => {
      const options = {};
      if (locale !== undefined) options.locale = locale;
      if (numerals !== undefined) options.numerals = numerals;
      const baseDate = base !== undefined ? toDate(base, 'base') : new Date();
      return formatRelativeTime(toDate(date, 'date'), baseDate, options);
    },
  },

  arabic_plural: {
    description:
      'Select the correct Arabic plural form for a count from the six CLDR categories (e.g. 5 books -> "كتب"). Returns the chosen word.',
    inputSchema: {
      n: z.number().describe('The count that selects the plural form.'),
      forms: z
        .object({
          zero: z.string().optional(),
          one: z.string().optional(),
          two: z.string().optional(),
          few: z.string().optional(),
          many: z.string().optional(),
          other: z.string(),
        })
        .describe(
          "Arabic plural forms keyed by CLDR category. 'other' is required; 'zero','one','two','few','many' are optional."
        ),
    },
    handler: async ({ n, forms }) => {
      return arabicPlural(n, forms);
    },
  },

  isolate_foreign: {
    description:
      'Wrap foreign/LTR runs (phone numbers, Latin text, URLs) inside Arabic text with Unicode bidi isolates so they render correctly in RTL contexts (e.g. "اتصل على +1 (555) 234-5678 الآن").',
    inputSchema: {
      text: z.string().describe('The mixed-direction text to process.'),
    },
    handler: async ({ text }) => {
      return isolateForeign(text);
    },
  },

  transliterate: {
    description:
      'Transliterate Arabic text to Latin script (e.g. "مُحَمَّد" -> "muhammad").',
    inputSchema: {
      text: z.string().describe('The Arabic text to transliterate.'),
    },
    handler: async ({ text }) => {
      return transliterate(text);
    },
  },

  slugify: {
    description:
      'Convert Arabic (or mixed) text into a URL-safe slug (e.g. "مدينة نصر" -> "mdynh-nsr").',
    inputSchema: {
      text: z.string().describe('The text to slugify.'),
      separator: z
        .string()
        .optional()
        .describe("Word separator character. Defaults to '-'."),
    },
    handler: async ({ text, separator }) => {
      const options = {};
      if (separator !== undefined) options.separator = separator;
      return slugify(text, options);
    },
  },

  validate_iban: {
    description:
      'Validate an IBAN (International Bank Account Number) using its checksum and country length (e.g. "SA03 8000 0000 6080 1016 7519" -> "true"). Returns "true" or "false".',
    inputSchema: {
      iban: z
        .string()
        .describe('The IBAN to validate; spaces are allowed.'),
    },
    handler: async ({ iban }) => {
      return String(isValidIBAN(iban));
    },
  },

  validate_saudi_id: {
    description:
      'Validate a Saudi national/iqama ID number using its Luhn-style checksum (e.g. "1012345672" -> "true"). Returns "true" or "false".',
    inputSchema: {
      id: z.string().describe('The 10-digit Saudi ID number to validate.'),
    },
    handler: async ({ id }) => {
      return String(isValidSaudiId(id));
    },
  },
};

// Flat list of tool names, useful for tests and registration loops.
export const toolNames = Object.keys(tools);
