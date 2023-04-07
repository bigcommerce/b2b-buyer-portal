import {
  ReactNode,
} from 'react'
import {
  IntlProvider,
  MessageFormatElement,
} from 'react-intl'
import {
  useSelector,
} from 'react-redux'

import * as defaultLocales from './locales'

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
  const lang = useSelector(({
    lang,
  }: {lang: string}) => (supportLang.includes(lang) ? lang : 'en'))

  return (
    <IntlProvider
      messages={locales[lang]}
      locale={lang}
      defaultLocale="en"
    >
      {children}
    </IntlProvider>
  )
}
