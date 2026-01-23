import { ReactNode, useMemo } from 'react';
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

const getLocaleFromURL = (): string => {
  const pathname = window.location?.pathname ?? '';
  const pathSegments = pathname.split('/').filter(Boolean);
  const potentialLocale = pathSegments[0];
  if (potentialLocale && /^[a-z]{2}(-[A-Z]{2})?$/i.test(potentialLocale)) {
    return potentialLocale.toLowerCase();
  }
  return 'en';
};

function LangProvider({ children, customText = {} }: LangProviderProps) {
  const translations = useSelector<RootState, Translations>(({ lang }) => lang.translations);
  const currentLocale = useMemo(() => getLocaleFromURL(), []);

  return (
    <IntlProvider
      defaultLocale="en"
      locale={currentLocale}
      messages={{ ...locales.en, ...customText, ...translations }}
    >
      {children}
    </IntlProvider>
  );
}

export default LangProvider;
