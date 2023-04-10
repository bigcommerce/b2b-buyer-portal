import {
  Dispatch,
  ReactNode,
} from 'react'

type BtnKeys = 'masqueradeButton' | 'addQuoteBtn' | 'floatingAction' | 'addToAllQuoteBtn' | 'shoppingListBtn' | 'portalStyle' | 'loginPageButton' | 'loginPageDisplay' | 'loginPageHtml' | 'accountLoginRegistration'

interface BtnStyle {
  color: string,
  text: string,
  buttonText: string,
  location: string,
  customCss: string,
  horizontalPadding: string,
  verticalPadding: string,
  classSelector: string,
  locationSelector: string,
  backgroundColor: string,
  primaryColor: string,
  enabled: boolean,
  b2b: boolean,
  b2c: boolean,
  createAccountButtonText?: string,
  primaryButtonColor?: string,
  signInButtonText?: string,
  displayStoreLogo?: boolean,
  pageTitle?: string,
  bottomHtmlRegionEnabled?: boolean,
  bottomHtmlRegionHtml?: string,
  createAccountPanelHtml?: string,
  topHtmlRegionEnabled?: boolean,
  topHtmlRegionHtml?: string,
}

export interface CustomStyleButtonState extends Record<BtnKeys, Partial<BtnStyle>>{
  globalButtonBackgroundColor: string,
}

export const initState = {
  globalButtonBackgroundColor: '#3385D6',
  portalStyle: {
    primaryColor: '#3385D6',
    backgroundColor: '#FEF9F5',
  },
  masqueradeButton: {
    color: '#FFFFFF',
    text: 'END MASQUERADE',
    location: '',
    customCss: '',
    horizontalPadding: '',
    verticalPadding: '',
  },
  addQuoteBtn: {
    color: '#fff',
    text: 'Add to Quote',
    customCss: '',
    classSelector: '',
    locationSelector: '',
    enabled: true,
  },
  floatingAction: {
    color: '#ed6c02',
    text: 'Finish quote',
    buttonText: 'Finish quote',
    location: '',
    customCss: '',
    horizontalPadding: '',
    verticalPadding: '',
    enabled: false,
  },
  addToAllQuoteBtn: {
    color: '#fff',
    text: 'Add All to Quote',
    customCss: '',
    classSelector: '',
    locationSelector: '',
    enabled: true,
  },
  shoppingListBtn: {
    color: '#74685c',
    text: 'Add to Shopping List',
    customCss: '',
    classSelector: '',
    locationSelector: '',
    enabled: true,
  },
  loginPageButton: {
    createAccountButtonText: 'CREATE ACCOUNT',
    enabled: true,
    primaryButtonColor: '#292a25',
    signInButtonText: 'SIGN IN',
  },
  loginPageDisplay: {
    displayStoreLogo: true,
    enabled: true,
    pageTitle: 'Sign In (test can delete)',
  },
  loginPageHtml: {
    bottomHtmlRegionEnabled: false,
    bottomHtmlRegionHtml: '',
    createAccountPanelHtml: '',
    enabled: true,
    topHtmlRegionEnabled: false,
    topHtmlRegionHtml: '',
  },
  accountLoginRegistration: {
    b2b: true,
    b2c: true,
  },
}

export interface CustomStyleButtonAction {
  type: string,
  payload: Partial<CustomStyleButtonState>
}

export type DispatchProps = Dispatch<Partial<CustomStyleButtonAction>>
export interface CustomStyleButtonContext {
  state: CustomStyleButtonState,
  dispatch: DispatchProps,
}

export interface CustomStyleButtonProviderProps {
  children: ReactNode
}
