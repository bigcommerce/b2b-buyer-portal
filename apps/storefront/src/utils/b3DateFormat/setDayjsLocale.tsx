import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { SUPPORT_LANGUAGE } from '@/constants';

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

// The global dayjs locale is limited to SUPPORT_LANGUAGE. The other dayjs locales imported
// above are only registered for the date pickers, which pick them by name.
// TODO: once the LOCAL-3509.Translate_b2b_dates experiment is removed, extend SUPPORT_LANGUAGE
// with the remaining imported locales (da, ja, nb, pl, pt, sv).
const toSupportedLanguage = (localeKey: string): string => {
  const [language] = (localeKey || 'en').toLowerCase().split('-');

  return SUPPORT_LANGUAGE.includes(language) ? language : 'en';
};

const setDayjsLocale = (localeKey: string) => {
  const activeLang = toSupportedLanguage(localeKey);

  dayjs.locale(activeLang);

  return activeLang;
};

export const getDayjsLocale = () => toSupportedLanguage(dayjs.locale());

export default setDayjsLocale;
