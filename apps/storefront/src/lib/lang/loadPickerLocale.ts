import type { deDE } from '@mui/x-date-pickers/locales';
import dayjs from 'dayjs';

type PickerLocale = typeof deDE;

type PickerLocaleText = NonNullable<
  PickerLocale['components']['MuiLocalizationProvider']['defaultProps']['localeText']
>;

const getLocaleText = (locale: PickerLocale): PickerLocaleText =>
  locale.components.MuiLocalizationProvider.defaultProps.localeText;

const dayjsLocaleLoaders: Record<string, () => Promise<unknown>> = {
  da: () => import('dayjs/locale/da'),
  'es-mx': () => import('dayjs/locale/es-mx'),
  ja: () => import('dayjs/locale/ja'),
  nb: () => import('dayjs/locale/nb'),
  pl: () => import('dayjs/locale/pl'),
  pt: () => import('dayjs/locale/pt'),
  'pt-br': () => import('dayjs/locale/pt-br'),
  sv: () => import('dayjs/locale/sv'),
};

const localeTextLoaders: Record<string, () => Promise<PickerLocaleText>> = {
  de: () => import('@mui/x-date-pickers/locales/deDE').then((m) => getLocaleText(m.deDE)),
  es: () => import('@mui/x-date-pickers/locales/esES').then((m) => getLocaleText(m.esES)),
  'es-mx': () => import('@mui/x-date-pickers/locales/esES').then((m) => getLocaleText(m.esES)),
  fr: () => import('@mui/x-date-pickers/locales/frFR').then((m) => getLocaleText(m.frFR)),
  it: () => import('@mui/x-date-pickers/locales/itIT').then((m) => getLocaleText(m.itIT)),
  ja: () => import('@mui/x-date-pickers/locales/jaJP').then((m) => getLocaleText(m.jaJP)),
  nb: () => import('@mui/x-date-pickers/locales/nbNO').then((m) => getLocaleText(m.nbNO)),
  nl: () => import('@mui/x-date-pickers/locales/nlNL').then((m) => getLocaleText(m.nlNL)),
  pl: () => import('@mui/x-date-pickers/locales/plPL').then((m) => getLocaleText(m.plPL)),
  pt: () => import('@mui/x-date-pickers/locales/ptBR').then((m) => getLocaleText(m.ptBR)),
  'pt-br': () => import('@mui/x-date-pickers/locales/ptBR').then((m) => getLocaleText(m.ptBR)),
  sv: () => import('@mui/x-date-pickers/locales/svSE').then((m) => getLocaleText(m.svSE)),
  zh: () => import('@mui/x-date-pickers/locales/zhCN').then((m) => getLocaleText(m.zhCN)),
};

const registerCustomParseFormat = () =>
  import('dayjs/plugin/customParseFormat').then((m) => dayjs.extend(m.default));

export const loadPickerLocale = async (locale: string): Promise<PickerLocaleText | undefined> => {
  const [, , localeText] = await Promise.all([
    registerCustomParseFormat(),
    dayjsLocaleLoaders[locale]?.(),
    localeTextLoaders[locale]?.(),
  ]);

  return localeText;
};
