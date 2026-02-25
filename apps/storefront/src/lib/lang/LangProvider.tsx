import { ReactNode, useEffect, useState } from 'react';
import { IntlProvider } from 'react-intl';
import { useSelector } from 'react-redux';

import localesPromise, { getCachedMessages } from './locales';

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
  const [defaultMessages, setDefaultMessages] = useState<Translations>(getCachedMessages);

  useEffect(() => {
    localesPromise.then(setDefaultMessages);
  }, []);

  return (
    <IntlProvider
      defaultLocale="en"
      locale="en"
      messages={{ ...defaultMessages, ...customText, ...translations }}
    >
      {children}
    </IntlProvider>
  );
}

export default LangProvider;
