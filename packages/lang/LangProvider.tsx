import { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'
import { useSelector } from 'react-redux'

import locales from './locales'

interface LangProviderProps {
  children: ReactNode
  customText?: Record<string, string>
}

export default function LangProvider({
  children,
  customText = {},
}: LangProviderProps) {
  const translations = useSelector(({ lang }) => lang.translations)
  return (
    <IntlProvider
      messages={{ ...locales.en, ...customText, ...translations }}
      locale="en"
      defaultLocale="en"
    >
      {children}
    </IntlProvider>
  )
}
