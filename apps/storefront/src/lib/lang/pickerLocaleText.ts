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

type PickerLocaleText = NonNullable<
  typeof deDE.components.MuiLocalizationProvider.defaultProps.localeText
>;

const localeTextByLocale: Record<string, PickerLocaleText> = {
  de: deDE.components.MuiLocalizationProvider.defaultProps.localeText,
  es: esES.components.MuiLocalizationProvider.defaultProps.localeText,
  'es-mx': esES.components.MuiLocalizationProvider.defaultProps.localeText,
  fr: frFR.components.MuiLocalizationProvider.defaultProps.localeText,
  it: itIT.components.MuiLocalizationProvider.defaultProps.localeText,
  ja: jaJP.components.MuiLocalizationProvider.defaultProps.localeText,
  nb: nbNO.components.MuiLocalizationProvider.defaultProps.localeText,
  nl: nlNL.components.MuiLocalizationProvider.defaultProps.localeText,
  pl: plPL.components.MuiLocalizationProvider.defaultProps.localeText,
  pt: ptBR.components.MuiLocalizationProvider.defaultProps.localeText,
  'pt-br': ptBR.components.MuiLocalizationProvider.defaultProps.localeText,
  sv: svSE.components.MuiLocalizationProvider.defaultProps.localeText,
  zh: zhCN.components.MuiLocalizationProvider.defaultProps.localeText,
};

export const getPickerLocaleText = (locale: string): PickerLocaleText | undefined =>
  localeTextByLocale[locale];
