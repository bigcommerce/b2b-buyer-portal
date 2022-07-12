import { IntlProvider, MessageFormatElement } from 'react-intl'
import React from 'react'

import { useB3CurrentLang } from './useB3CurrentLang'
import * as defaultLocales from './locales'

type Props = {
  children?: React.ReactNode;
  locales?: {
    [k: string]: Record<string, string> | Record<string, MessageFormatElement[]>
  };
};

export function LangProvider({ children, locales = defaultLocales }: Props) {
  const [lang] = useB3CurrentLang()

  return (
    <IntlProvider messages={locales[lang] || locales.en} locale={lang} defaultLocale="en">
      {children}
    </IntlProvider>
  )
}
