import {
  createTheme,
  ThemeProvider,
} from '@mui/material/styles'
import * as materialMultiLanguages from '@mui/material/locale'
import React from 'react'

import {
  useB3CurrentLang,
} from '@b3/lang'

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
  [K: string]: materialMultiLanguages.Localization
}

type Props = {
  children?: React.ReactNode;
}

const theme = (lang: string) => createTheme({
  palette: {
    background: {
      default: '#fef9f5',
    },
  },
}, (materialMultiLanguages as MaterialMultiLanguagesType)[MUI_LANG_MAP[lang] || 'enUS'])

function B3ThemeProvider({
  children,
}: Props) {
  const [lang] = useB3CurrentLang()

  return (
    <ThemeProvider theme={theme(lang)}>
      { children }
    </ThemeProvider>
  )
}

export default B3ThemeProvider
