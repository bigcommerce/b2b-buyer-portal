import { ReactNode } from 'react'
import { IntlProvider } from 'react-intl'

import locales from './locales'

interface LangProviderProps {
  children: ReactNode
}

export default function LangProvider({ children }: LangProviderProps) {
  return (
    <IntlProvider messages={locales.en} locale="en" defaultLocale="en">
      {children}
    </IntlProvider>
  )
}
