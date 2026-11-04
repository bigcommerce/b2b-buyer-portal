import type { Locales } from '@/store/slices/global';

import { getActiveLocale } from './getActiveLocale';
import { isSupportedLocale } from './locales';

const DAYJS_LOCALE_KEYS = [
  'en',
  'da',
  'de',
  'es',
  'es-mx',
  'fr',
  'it',
  'ja',
  'nb',
  'nl',
  'pl',
  'pt',
  'pt-br',
  'sv',
  'zh',
];

interface ResolvePickerLocaleParams {
  isEnabled: boolean;
  locales: Locales;
  fallbackLocale: string;
}

const toDayjsLocale = (code: string): string => {
  const lowerCode = code.toLowerCase();
  const baseLanguage = lowerCode.split('-')[0];

  if (baseLanguage === 'zh') {
    return 'zh';
  }

  if (!isSupportedLocale(code)) {
    return 'en';
  }

  if (DAYJS_LOCALE_KEYS.includes(lowerCode)) {
    return lowerCode;
  }

  if (baseLanguage === 'no') {
    return 'nb';
  }

  return DAYJS_LOCALE_KEYS.includes(baseLanguage) ? baseLanguage : 'en';
};

export const resolvePickerLocale = ({
  isEnabled,
  locales,
  fallbackLocale,
}: ResolvePickerLocaleParams): string => {
  if (!isEnabled) {
    return fallbackLocale;
  }

  const activeCode = getActiveLocale(locales)?.code;

  return activeCode ? toDayjsLocale(activeCode) : fallbackLocale;
};
