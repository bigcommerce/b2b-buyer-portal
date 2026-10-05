import dayjs from 'dayjs';
import merge from 'lodash-es/merge';

import { getActiveDateLocale } from '@/lib/lang/getActiveDateLocale';
import { store } from '@/store';

import { buildDateSettings } from './buildDateSettings';
import DateFormatter from './php-date-format.js';
import {
  formatWithEnglishOrdinalDay,
  hasEnglishOrdinalDay,
  phpFormatToIntlOptions,
} from './phpFormatToIntlOptions';

type DisplayType = 'display' | 'extendedDisplay';
type Handler = 'formatDate' | 'parseDate';

interface Formatter {
  formatDate(date: Date, format: string): string | null;
  parseDate(date: Date, format: string): Date | string | number | null;
}

const fmt = new DateFormatter();
const phpFormatters = new Map<string, DateFormatter>();
const intlFormatters = new Map<string, Intl.DateTimeFormat | null>();

const getPhpFormatter = (locale: string | undefined) => {
  if (!locale) {
    return fmt;
  }

  const cached = phpFormatters.get(locale);

  if (cached) {
    return cached;
  }

  try {
    const formatter = new DateFormatter({ dateSettings: buildDateSettings(locale) });

    phpFormatters.set(locale, formatter);

    return formatter;
  } catch {
    return fmt;
  }
};

const getIntlFormatter = (locale: string, format: string) => {
  const key = `${locale}|${format}`;

  if (intlFormatters.has(key)) {
    return intlFormatters.get(key) ?? undefined;
  }

  let formatter: Intl.DateTimeFormat | null = null;
  const options = phpFormatToIntlOptions(format);

  if (options) {
    try {
      formatter = new Intl.DateTimeFormat(locale, options);
    } catch {
      formatter = null;
    }
  }

  intlFormatters.set(key, formatter);

  return formatter ?? undefined;
};

const getFormatter = (format: string): Formatter => {
  const dateLocale = getActiveDateLocale();
  const phpFormatter = getPhpFormatter(dateLocale?.code);

  if (!dateLocale || dateLocale.isDefault) {
    return phpFormatter;
  }

  const intlFormatter = getIntlFormatter(dateLocale.code, format);

  if (!intlFormatter) {
    return phpFormatter;
  }

  const withOrdinalDay = hasEnglishOrdinalDay(dateLocale.code, format);

  // Intl formats (locale decides order and punctuation); parsing stays with the PHP formatter.
  return {
    formatDate: (date) =>
      withOrdinalDay
        ? formatWithEnglishOrdinalDay(intlFormatter, date)
        : intlFormatter.format(date),
    parseDate: (date, dateFormat) => phpFormatter.parseDate(date, dateFormat),
  };
};

const formatCreator =
  (displayType: DisplayType, handler: Handler, useOffset = true) =>
  (timestamp: string | number, isDateStr = false): string | number | Date => {
    const { timeFormat } = store.getState().storeInfo;
    const dateFormat = merge(
      {
        display: 'j M Y',
        export: 'M j Y',
        extendedDisplay: 'M j Y @ g:i A',
        offset: 0,
      },
      timeFormat,
    );

    const display = dateFormat[displayType];

    if (!timestamp) return '';

    const dateTime = isDateStr ? timestamp : parseInt(String(timestamp), 10) * 1000;
    const localDate = new Date(dateTime);
    const localTime = localDate.getTime();
    const offset = useOffset ? localDate.getTimezoneOffset() * 60000 + dateFormat.offset * 1000 : 0;
    const utcTime = localTime + offset;

    const dateObject = new Date(utcTime);
    const formatter = getFormatter(display);

    switch (handler) {
      case 'formatDate':
        return formatter.formatDate(dateObject, display) || '';
      case 'parseDate':
        return formatter.parseDate(dateObject, display) || '';
      default:
        throw new Error('Invalid value');
    }
  };

export const displayFormat = formatCreator('display', 'formatDate');
export const displayExtendedFormat = formatCreator('extendedDisplay', 'formatDate');

/**
 * Formats a Unix timestamp (seconds) as a locale-aware date (e.g. "August 16, 2018").
 * Uses dayjs `LL` format. Locale is set in setDayjsLocale.tsx.
 *
 * @param date - Unix timestamp in seconds
 */
export const dateWithLocaleSupport = (date: number) => dayjs.unix(date).format('LL');

export const getUTCTimestamp = (
  timestamp: string | number,
  adjustment?: boolean,
  isDateStr = false,
) => {
  const { timeFormat } = store.getState().storeInfo;
  const dateFormat = merge(
    {
      display: 'j M Y',
      export: 'M j Y',
      extendedDisplay: 'M j Y @ g:i A',
      offset: 0,
    },
    timeFormat,
  );

  if (!timestamp) return '';
  const dateTime = isDateStr ? timestamp : parseInt(String(timestamp), 10) * 1000;
  const localDate = new Date(dateTime);
  const localTime = localDate.getTime();
  const offset = localDate.getTimezoneOffset() * 60000 + dateFormat.offset * 1000;

  const adjustmentTime = adjustment ? (24 * 60 * 60 - 1) * 1000 : 0;

  const utcTime = localTime + offset + adjustmentTime;

  return utcTime / 1000;
};
