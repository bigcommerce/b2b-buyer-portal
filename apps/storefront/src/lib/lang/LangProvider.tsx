import { ReactNode } from 'react';
import { IntlProvider } from 'react-intl';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useAppSelector } from '@/store';

import { getActiveLocale } from './getActiveLocale';
import { en } from './locales';
import { pickLocaleBundle } from './pickLocaleBundle';
import { useLocaleBundle } from './useLocaleBundle';

interface LangProviderProps {
  readonly children: ReactNode;
  readonly customText?: Record<string, string>;
}

function LangProvider({ children, customText = {} }: LangProviderProps) {
  const translations = useAppSelector(({ lang }) => lang.translations);
  const isMultiLang = useFeatureFlag('LOCAL-3191.B2B_multi_language');
  const localesList = useAppSelector(({ global }) => global.locales);

  const code = isMultiLang ? (getActiveLocale(localesList)?.code ?? 'en') : 'en';
  const { ready, bundles } = useLocaleBundle(code);

  if (!ready) {
    return null;
  }

  const localeMessages = isMultiLang ? pickLocaleBundle(code, bundles) : {};

  return (
    <IntlProvider
      defaultLocale="en"
      locale={code}
      messages={{ ...en, ...localeMessages, ...customText, ...translations }}
    >
      {children}
    </IntlProvider>
  );
}

export default LangProvider;
