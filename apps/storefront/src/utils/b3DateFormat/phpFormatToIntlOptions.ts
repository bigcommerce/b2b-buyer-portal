const TOKEN_OPTIONS: Record<string, Intl.DateTimeFormatOptions> = {
  d: { day: '2-digit' },
  j: { day: 'numeric' },
  D: { weekday: 'short' },
  l: { weekday: 'long' },
  M: { month: 'short' },
  F: { month: 'long' },
  m: { month: '2-digit' },
  n: { month: 'numeric' },
  Y: { year: 'numeric' },
  y: { year: '2-digit' },
  g: { hour: 'numeric' },
  G: { hour: 'numeric' },
  h: { hour: '2-digit' },
  H: { hour: '2-digit' },
  i: { minute: '2-digit' },
  s: { second: '2-digit' },
};

const ENGLISH_ORDINAL_SUFFIXES: Record<Intl.LDMLPluralRule, string> = {
  zero: 'th',
  one: 'st',
  two: 'nd',
  few: 'rd',
  many: 'th',
  other: 'th',
};

// Meridiem is handled by the locale; the English ordinal suffix by `formatWithEnglishOrdinalDay`.
const IGNORED_TOKENS = new Set(['a', 'A', 'S']);
const DAY_TOKENS = new Set(['d', 'j']);
const englishOrdinalRules = new Intl.PluralRules('en', { type: 'ordinal' });

const isLetter = (char: string) => /[a-z]/i.test(char);
const isEnglishLocale = (locale: string) => locale.toLowerCase().split('-')[0] === 'en';

/**
 * Converts a PHP-style date format into Intl.DateTimeFormat options, keeping which
 * date parts are shown and their style, while leaving order and punctuation to the locale.
 * Returns undefined when the format uses tokens that cannot be expressed with Intl
 * or when it contains no date/time parts.
 */
export const phpFormatToIntlOptions = (format: string): Intl.DateTimeFormatOptions | undefined => {
  const options: Intl.DateTimeFormatOptions = {};

  for (let index = 0; index < format.length; index += 1) {
    const char = format[index];

    if (char === '\\') {
      // The next character is a literal
      index += 1;
    } else if (TOKEN_OPTIONS[char]) {
      Object.assign(options, TOKEN_OPTIONS[char]);
    } else if (isLetter(char) && !IGNORED_TOKENS.has(char)) {
      return undefined;
    }
  }

  return Object.keys(options).length > 0 ? options : undefined;
};

/**
 * Whether a PHP-style date format asks for the English ordinal suffix (`S`) on the day,
 * e.g. `jS F Y` → "1st September 2026".
 */
export const hasOrdinalDaySuffix = (format: string): boolean => {
  for (let index = 0; index < format.length; index += 1) {
    const char = format[index];

    if (char === '\\') {
      // The next character is a literal
      index += 1;
    } else if (DAY_TOKENS.has(char) && format[index + 1] === 'S') {
      return true;
    }
  }

  return false;
};

/**
 * Whether the day should get the English ordinal suffix for this locale and format.
 * The `S` suffix is English-only; other locales show the bare day number.
 */
export const hasEnglishOrdinalDay = (locale: string, format: string): boolean =>
  isEnglishLocale(locale) && hasOrdinalDaySuffix(format);

/**
 * Formats a date and appends the English ordinal suffix to the day part
 * (Intl has no ordinal day option), e.g. "September 1st, 2026".
 */
export const formatWithEnglishOrdinalDay = (formatter: Intl.DateTimeFormat, date: Date): string =>
  formatter
    .formatToParts(date)
    .map(({ type, value }) =>
      type === 'day'
        ? `${value}${ENGLISH_ORDINAL_SUFFIXES[englishOrdinalRules.select(Number(value))]}`
        : value,
    )
    .join('');
