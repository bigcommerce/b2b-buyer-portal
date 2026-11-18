import type { Locales } from '@/store/slices/global';

import { getActiveLocale } from './getActiveLocale';
import { isSupportedLocale } from './locales';
import {
  DAYJS_TO_STOREFRONT_LANGUAGE,
  STOREFRONT_TO_DAYJS_LANGUAGE,
} from './storefrontToDayjsLanguage';

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

const toDayjsLocale = (code: string): string | undefined => {
  const lowerCode = code.toLowerCase();
  const [language] = lowerCode.split('-');

  if (!isSupportedLocale(DAYJS_TO_STOREFRONT_LANGUAGE[language] ?? language)) {
    return undefined;
  }

  const dayjsLanguage = STOREFRONT_TO_DAYJS_LANGUAGE[language] ?? language;

  return [lowerCode, dayjsLanguage].find((key) => DAYJS_LOCALE_KEYS.includes(key));
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
  const defaultCode = locales.find(({ isDefault }) => isDefault)?.code;

  return (
    (activeCode && toDayjsLocale(activeCode)) ||
    (defaultCode && toDayjsLocale(defaultCode)) ||
    fallbackLocale
  );
};
