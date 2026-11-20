import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { SUPPORT_LANGUAGE } from '@/constants';

import 'dayjs/locale/de';
import 'dayjs/locale/en';
import 'dayjs/locale/es';
import 'dayjs/locale/fr';
import 'dayjs/locale/it';
import 'dayjs/locale/nl';
import 'dayjs/locale/zh';

dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

// The global dayjs locale is limited to SUPPORT_LANGUAGE. The other dayjs locales are only needed
// by the date pickers, which load them on demand (see lib/lang/loadPickerLocale.ts).
// TODO: once the LOCAL-3509.Translate_b2b_dates experiment is removed, extend SUPPORT_LANGUAGE
// with the remaining picker locales (da, ja, nb, pl, pt, sv) and import them here.
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
