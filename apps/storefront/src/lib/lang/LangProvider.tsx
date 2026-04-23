import { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';
import { useSelector } from 'react-redux';

import locales from './locales';

interface LangProviderProps {
  readonly children: ReactNode;
  readonly customText?: Record<string, string>;
}

type Translations = Record<string, string>;

interface RootState {
  lang: {
    translations: Translations;
    locale: string;
  };
}

function LangProvider({ children, customText = {} }: LangProviderProps) {
  const translations = useSelector<RootState, Translations>(({ lang }) => lang.translations);
  const locale = useSelector<RootState, string>(({ lang }) => lang.locale);

  return (
    <IntlProvider
      defaultLocale="en"
      locale={locale}
      messages={{ ...locales.en, ...customText, ...translations }}
    >
      {children}
    </IntlProvider>
  );
}

export default LangProvider;
