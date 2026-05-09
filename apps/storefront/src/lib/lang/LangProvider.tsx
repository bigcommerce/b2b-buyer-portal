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

  // Render unconditionally so children (notably B3PageMask) stay mounted while
  // the locale bundle is loading. Until the bundle resolves we fall back to
  // English; once it lands react-intl swaps the messages in place.
  const localeMessages = isMultiLang && ready ? pickLocaleBundle(code, bundles) : {};
  const activeLocale = ready ? code : 'en';

  return (
    <IntlProvider
      defaultLocale="en"
      locale={activeLocale}
      messages={{ ...en, ...localeMessages, ...customText, ...translations }}
    >
      {children}
    </IntlProvider>
  );
}

export default LangProvider;
