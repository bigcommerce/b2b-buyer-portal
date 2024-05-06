import { useContext, useState } from 'react';
import { LangProvider } from '@b3/lang';

import { CustomStyleContext } from './shared/customStyleButtton';

export function LangWrapper({ children }: { children: React.ReactNode }) {
  const {
    state: {
      loginPageButton: { createAccountButtonText, signInButtonText },
      loginPageDisplay: { pageTitle },
      masqueradeButton,
      addQuoteBtn,
      floatingAction,
      addToAllQuoteBtn,
      shoppingListBtn,
    },
  } = useContext(CustomStyleContext);
  const [customText] = useState<Record<string, string>>(
    Object.entries({
      'login.button.createAccount': createAccountButtonText,
      'login.button.signInUppercase': signInButtonText,
      'login.button.signIn': pageTitle,
      'customStyles.masqueradeButton': masqueradeButton,
      'customStyles.addQuoteBtn': addQuoteBtn,
      'customStyles.floatingAction': floatingAction,
      'customStyles.addToAllQuoteBtn': addToAllQuoteBtn,
      'customStyles.shoppingListBtn': shoppingListBtn,
    })
      .filter(([, value]) => value)
      .reduce(
        (acc, [translationKey, customizedText]) => ({
          ...acc,
          [translationKey]: customizedText,
        }),
        {},
      ),
  );

  return <LangProvider customText={customText}>{children}</LangProvider>;
}

export default {
  LangWrapper,
};
