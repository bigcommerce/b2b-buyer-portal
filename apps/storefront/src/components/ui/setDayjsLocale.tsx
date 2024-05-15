import dayjs from 'dayjs';

import { SUPPORT_LANGUAGE } from '@/constants';

import 'dayjs/locale/zh';
import 'dayjs/locale/en';
import 'dayjs/locale/nl';
import 'dayjs/locale/it';
import 'dayjs/locale/fr';
import 'dayjs/locale/de';
import 'dayjs/locale/es';

const setDayjsLocale = (localeKey: string) => {
  const locale = localeKey || 'en';
  dayjs.locale(locale);

  const activeLang = SUPPORT_LANGUAGE.find((item) => locale.includes(item)) || 'en';

  return activeLang;
};

export default setDayjsLocale;
