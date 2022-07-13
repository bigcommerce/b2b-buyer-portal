import { IntlProvider, MessageFormatElement } from 'react-intl'
import { ReactNode, useContext } from 'react'

import * as defaultLocales from './locales'
import { LangContext, LangContextProvider } from './context/LangContext'

type LangProviderProps = {
  children?: ReactNode,
  locales?: {
    [k: string]: Record<string, string> | Record<string, MessageFormatElement[]>
  },
  allowLang?: string[]
};

const LangContentProvider = ({ children, locales = defaultLocales, allowLang = ['en'] }: LangProviderProps) => {
  const { state } = useContext(LangContext)
  const lang = allowLang.includes(state.lang) ? state.lang : 'en'

  return (
    <IntlProvider messages={locales[lang] || locales.en} locale={lang} defaultLocale="en">
      {children}
    </IntlProvider>
  )
}

export const LangProvider = (props: LangProviderProps) => (
  <LangContextProvider>
    <LangContentProvider {...props} />
  </LangContextProvider>
)
