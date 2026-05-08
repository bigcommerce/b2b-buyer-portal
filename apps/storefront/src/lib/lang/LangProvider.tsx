import { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useAppSelector } from '@/store';

import { getActiveLocaleCode } from './getActiveLocaleCode';
import locales from './locales';
import { pickLocaleBundle } from './pickLocaleBundle';

interface LangProviderProps {
  readonly children: ReactNode;
  readonly customText?: Record<string, string>;
}

const localeBundles = locales as Record<string, Record<string, string> | undefined>;

function LangProvider({ children, customText = {} }: LangProviderProps) {
  const translations = useAppSelector(({ lang }) => lang.translations);
  const isMultiLang = useFeatureFlag('LOCAL-3191.B2B_multi_language');
  const localesList = useAppSelector(({ global }) => global.locales);

  const code = isMultiLang ? getActiveLocaleCode(localesList) : 'en';
  const localeMessages = pickLocaleBundle(code, localeBundles);

  return (
    <IntlProvider
      defaultLocale="en"
      locale={code}
      messages={{ ...locales.en, ...localeMessages, ...customText, ...translations }}
    >
      {children}
    </IntlProvider>
  );
}

export default LangProvider;
