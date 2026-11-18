import {
  deDE,
  esES,
  frFR,
  itIT,
  jaJP,
  nbNO,
  nlNL,
  plPL,
  ptBR,
  svSE,
  zhCN,
} from '@mui/x-date-pickers/locales';

type PickerLocale = typeof deDE;

type PickerLocaleText = NonNullable<
  PickerLocale['components']['MuiLocalizationProvider']['defaultProps']['localeText']
>;

const getLocaleText = ({ components }: PickerLocale): PickerLocaleText =>
  components.MuiLocalizationProvider.defaultProps.localeText;

const localeTextByLocale: Record<string, PickerLocaleText> = {
  de: getLocaleText(deDE),
  es: getLocaleText(esES),
  'es-mx': getLocaleText(esES),
  fr: getLocaleText(frFR),
  it: getLocaleText(itIT),
  ja: getLocaleText(jaJP),
  nb: getLocaleText(nbNO),
  nl: getLocaleText(nlNL),
  pl: getLocaleText(plPL),
  pt: getLocaleText(ptBR),
  'pt-br': getLocaleText(ptBR),
  sv: getLocaleText(svSE),
  zh: getLocaleText(zhCN),
};

export const getPickerLocaleText = (locale: string): PickerLocaleText | undefined =>
  localeTextByLocale[locale] ?? localeTextByLocale[locale.split('-')[0]];
