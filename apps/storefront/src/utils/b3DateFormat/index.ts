import dayjs from 'dayjs';
import merge from 'lodash-es/merge';

import { getActiveDateLocale } from '@/lib/lang/getActiveDateLocale';
import { store } from '@/store';

import { buildDateSettings } from './buildDateSettings';
import DateFormatter from './php-date-format.js';

type DisplayType = 'display' | 'extendedDisplay';
type Handler = 'formatDate' | 'parseDate';

const fmt = new DateFormatter();
const localizedFormatters = new Map<string, DateFormatter>();

const getFormatter = (): DateFormatter => {
  const locale = getActiveDateLocale();

  if (!locale) {
    return fmt;
  }

  let formatter = localizedFormatters.get(locale);

  if (!formatter) {
    formatter = new DateFormatter({ dateSettings: buildDateSettings(locale) });
    localizedFormatters.set(locale, formatter);
  }

  return formatter;
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
    const formatter = getFormatter();

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
