import { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { useSelector } from 'react-redux'

import locales from './locales'

interface LangProviderProps {
  children: ReactNode
}

export default function LangProvider({ children }: LangProviderProps) {
  const translations = useSelector(({ lang }) => lang.translations)
  return (
    <IntlProvider
      messages={{ ...locales.en, ...translations }}
      locale="en"
      defaultLocale="en"
    >
      {children}
    </IntlProvider>
  )
}
