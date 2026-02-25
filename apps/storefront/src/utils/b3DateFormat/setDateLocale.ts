import { type Locale } from 'date-fns';
import { de } from 'date-fns/locale/de';
import { enUS } from 'date-fns/locale/en-US';
import { es } from 'date-fns/locale/es';
import { fr } from 'date-fns/locale/fr';
import { it } from 'date-fns/locale/it';
import { nl } from 'date-fns/locale/nl';
import { zhCN } from 'date-fns/locale/zh-CN';
import dayjs from 'dayjs';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { SUPPORT_LANGUAGE } from '@/constants';

import 'dayjs/locale/de';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';
import 'dayjs/locale/it';
import 'dayjs/locale/nl';
import 'dayjs/locale/zh';

dayjs.extend(localizedFormat);

const LOCALE_MAP: Record<string, Locale> = {
  en: enUS,
  zh: zhCN,
  fr,
  nl,
  de,
  it,
  es,
};

let currentLocale: Locale = enUS;

const setDateLocale = (localeKey: string) => {
  const key = localeKey || 'en';
  const activeLang = SUPPORT_LANGUAGE.find((item) => key.includes(item)) || 'en';
  currentLocale = LOCALE_MAP[activeLang] || enUS;
  dayjs.locale(activeLang);

  return activeLang;
};

export const getDateLocale = (): Locale => currentLocale;

export const getDateLang = (): string => {
  const langEntry = Object.entries(LOCALE_MAP).find(([, locale]) => locale === currentLocale);
  return langEntry ? langEntry[0] : 'en';
};

export default setDateLocale;
