import { createTheme } from '@mui/material/styles'
import * as materialMultiLanguages from '@mui/material/locale'

type LangMapType = {
  [index: string]: string
}

const MUI_LANG_MAP: LangMapType = {
  en: 'enUS',
  zh: 'zhCN',
  fr: 'frFR',
  nl: 'nlNL',
  de: 'deDE',
  it: 'itIT',
  es: 'esES',
}

type MaterialMultiLanguagesType = {
  [index: string]: materialMultiLanguages.Localization
}

const theme = (lang: string) => createTheme({}, (materialMultiLanguages as MaterialMultiLanguagesType)[MUI_LANG_MAP[lang] || 'enUS'])

export default theme
