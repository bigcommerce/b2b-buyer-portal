import type { deDE } from '@mui/x-date-pickers/locales';

type PickerLocale = typeof deDE;

type PickerLocaleText = NonNullable<
  PickerLocale['components']['MuiLocalizationProvider']['defaultProps']['localeText']
>;

const getLocaleText = (locale: PickerLocale): PickerLocaleText =>
  locale.components.MuiLocalizationProvider.defaultProps.localeText;

// The picker locales are loaded on demand: they are only needed when the date localization
// experiment is on and the buyer browses a non-default storefront language.
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

// Registers the dayjs locale and resolves the MUI picker labels for a dayjs locale key.
// Both load in parallel and the result is all or nothing: if either fails, the promise rejects and
// the caller keeps the non-localized picker. A dayjs locale that registered before the other load
// failed is harmless, because it is only used once a picker selects it.
// English has no MUI labels (the picker default is used), and Danish has none in the installed MUI.
export const loadPickerLocale = async (locale: string): Promise<PickerLocaleText | undefined> => {
  const [, localeText] = await Promise.all([
    dayjsLocaleLoaders[locale]?.(),
    localeTextLoaders[locale]?.(),
  ]);

  return localeText;
};
