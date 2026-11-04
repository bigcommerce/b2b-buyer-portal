import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import localizedFormat from 'dayjs/plugin/localizedFormat';

import { SUPPORT_LANGUAGE } from '@/constants';

import 'dayjs/locale/zh';
import 'dayjs/locale/en';
import 'dayjs/locale/nl';
import 'dayjs/locale/it';
import 'dayjs/locale/fr';
import 'dayjs/locale/de';
import 'dayjs/locale/es';
import 'dayjs/locale/da';
import 'dayjs/locale/ja';
import 'dayjs/locale/nb';
import 'dayjs/locale/pl';
import 'dayjs/locale/pt';
import 'dayjs/locale/pt-br';
import 'dayjs/locale/sv';
import 'dayjs/locale/es-mx';

dayjs.extend(customParseFormat);
dayjs.extend(localizedFormat);

const setDayjsLocale = (localeKey: string) => {
  const locale = localeKey || 'en';
  dayjs.locale(locale);

  const activeLang = SUPPORT_LANGUAGE.find((item) => locale.includes(item)) || 'en';

  return activeLang;
};

export const getDayjsLocale = () => {
  const locale = dayjs.locale();
  return SUPPORT_LANGUAGE.find((item) => locale.includes(item)) || 'en';
};

export default setDayjsLocale;
