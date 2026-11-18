import type { Locales } from '@/store/slices/global';

import { getActiveLocale } from './getActiveLocale';
import { isSupportedLocale } from './locales';
import { STOREFRONT_TO_DAYJS_LANGUAGE } from './storefrontToDayjsLanguage';

interface ResolvePickerLocaleParams {
  isEnabled: boolean;
  locales: Locales;
  fallbackLocale: string;
}

const DAYJS_LOCALE_KEYS = [
  'da',
  'de',
  'en',
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

const toDayjsLocale = (code: string, fallbackLocale: string): string => {
  if (!isSupportedLocale(code)) {
    return fallbackLocale;
  }

  const lowerCode = code.toLowerCase();
  const [language] = lowerCode.split('-');
  const baseLanguage = STOREFRONT_TO_DAYJS_LANGUAGE[language] ?? language;

  return [lowerCode, baseLanguage].find((key) => DAYJS_LOCALE_KEYS.includes(key)) ?? fallbackLocale;
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

  return activeCode ? toDayjsLocale(activeCode, fallbackLocale) : fallbackLocale;
};
