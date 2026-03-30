import { useContext } from 'react';

import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { defaultCreateAccountPanel } from '@/shared/customStyleButton/context/config';
import { GlobalContext } from '@/shared/global';

export const useLoginInfo = () => {
  const {
    state: { logo },
  } = useContext(GlobalContext);
  const {
    state: { loginPageButton, loginPageDisplay, loginPageHtml },
  } = useContext(CustomStyleContext);
  const b3Lang = useB3Lang();

  const { createAccountButtonText, primaryButtonColor, signInButtonText } = loginPageButton;
  const { displayStoreLogo } = loginPageDisplay;

  const {
    bottomHtmlRegionEnabled,
    bottomHtmlRegionHtml,
    createAccountPanelHtml,
    topHtmlRegionEnabled,
    topHtmlRegionHtml,
  } = loginPageHtml;

  const loginInfo = {
    loginBtn: signInButtonText || b3Lang('login.button.signInUppercase'),
    createAccountButtonText: createAccountButtonText || b3Lang('login.button.createAccount'),
    btnColor: primaryButtonColor || '',
    widgetHeadText: topHtmlRegionEnabled ? topHtmlRegionHtml : undefined,
    widgetBodyText: createAccountPanelHtml || defaultCreateAccountPanel,
    widgetFooterText: bottomHtmlRegionEnabled ? bottomHtmlRegionHtml : undefined,
    logo: displayStoreLogo ? logo : undefined,
  };
  return loginInfo;
};
