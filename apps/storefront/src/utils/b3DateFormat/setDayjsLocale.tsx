import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { SUPPORT_LANGUAGE } from '@/constants';
import { STOREFRONT_TO_DAYJS_LANGUAGE } from '@/lib/lang/storefrontToDayjsLanguage';

import 'dayjs/locale/da';
import 'dayjs/locale/de';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import 'dayjs/locale/es-mx';
import 'dayjs/locale/fr';
import 'dayjs/locale/it';
import 'dayjs/locale/ja';
import 'dayjs/locale/nb';
import 'dayjs/locale/nl';
import 'dayjs/locale/pl';
import 'dayjs/locale/pt';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/sv';
import 'dayjs/locale/zh';

dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

const toSupportedLanguage = (localeKey: string): string => {
  const baseLanguage = (localeKey || 'en').toLowerCase().split('-')[0];
  const language = STOREFRONT_TO_DAYJS_LANGUAGE[baseLanguage] ?? baseLanguage;

  return SUPPORT_LANGUAGE.includes(language) ? language : 'en';
};

const setDayjsLocale = (localeKey: string) => {
  const activeLang = toSupportedLanguage(localeKey);

  dayjs.locale(activeLang);

  return activeLang;
};

export const getDayjsLocale = () => toSupportedLanguage(dayjs.locale());

export default setDayjsLocale;
