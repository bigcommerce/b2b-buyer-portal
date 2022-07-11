import { IntlProvider, MessageFormatElement } from 'react-intl'
import React from 'react'
import { ThemeProvider, Theme } from '@mui/material/styles'

import { BrowserLanguage } from '@b3/utils'

import * as defaultLocales from './locales'
import defaultTheme from './theme'

type Props = {
  children?: React.ReactNode;
  theme?: (lang: string) => Theme;
  locales?: {
    [k: string]: Record<string, string> | Record<string, MessageFormatElement[]>
  };
};

export function LangProvider({ children, theme = defaultTheme, locales = defaultLocales }: Props) {
  const lang = BrowserLanguage()

  return (
    <IntlProvider messages={locales[lang] || locales.en} locale={lang} defaultLocale="en">
      <ThemeProvider theme={theme(lang)}>
        {children}
      </ThemeProvider>
    </IntlProvider>
  )
}
