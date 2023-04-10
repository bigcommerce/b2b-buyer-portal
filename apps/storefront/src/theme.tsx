import {
  createTheme,
  ThemeProvider,
} from '@mui/material/styles'
import * as materialMultiLanguages from '@mui/material/locale'
import React, {
  useContext,
} from 'react'
import {
  useSelector,
} from 'react-redux'
import {
  RootState,
} from './store'

import {
  CustomStyleContext,
} from './shared/customStyleButtton'

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

function B3ThemeProvider({
  children,
}: Props) {
  const lang = useSelector(({
    lang,
  }: RootState) => lang)

  const {
    state: {
      portalStyle,
    },
  } = useContext(CustomStyleContext)

  const {
    backgroundColor = '',
  } = portalStyle

  const theme = (lang: string) => createTheme({
    palette: {
      background: {
        default: backgroundColor,
      },
    },
  }, (materialMultiLanguages as MaterialMultiLanguagesType)[MUI_LANG_MAP[lang] || 'enUS'])

  return (
    <ThemeProvider theme={theme(lang)}>
      { children }
    </ThemeProvider>
  )
}

export default B3ThemeProvider
