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
  };
}

function LangProvider({ children, customText = {} }: LangProviderProps) {
  const translations = useSelector<RootState, Translations>(({ lang }) => lang.translations);

  return (
    <IntlProvider
      defaultLocale="en"
      locale="en"
      messages={{ ...locales.en, ...customText, ...translations }}
    >
      {children}
    </IntlProvider>
  );
}

export default LangProvider;
