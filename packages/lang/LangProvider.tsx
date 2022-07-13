import { IntlProvider, MessageFormatElement } from 'react-intl'
import { ReactNode, useContext } from 'react'

import * as defaultLocales from './locales'
import { LangContext, LangContextProvider } from './context/LangContext'

type LangProviderProps = {
  children?: ReactNode,
  locales?: {
    [k: string]: Record<string, string> | Record<string, MessageFormatElement[]>
  },
  supportLang: string[]
};

export const LangProvider = ({
  children,
  locales = defaultLocales,
  supportLang,
}: LangProviderProps) => {
  const { state } = useContext(LangContext)
  const lang = supportLang.includes(state.lang) ? state.lang : 'en'

  return (
    <LangContextProvider>
      <IntlProvider messages={locales[lang]} locale={lang} defaultLocale="en">
        {children}
      </IntlProvider>
    </LangContextProvider>
  )
}
