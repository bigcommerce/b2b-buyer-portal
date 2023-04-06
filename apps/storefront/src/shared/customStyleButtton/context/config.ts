import {
  Dispatch,
  ReactNode,
} from 'react'

type BtnKeys = 'masqueradeButton' | 'addQuoteBtn' | 'floatingAction' | 'addToAllQuoteBtn' | 'shoppingListBtn' | 'loginPageButton' | 'loginPageDisplay' | 'loginPageHtml' | 'accountLoginRegistration'

interface BtnStyle {
  color: string,
  buttonText: string,
  location: string,
  customCss: string,
  horizontalPadding: string,
  verticalPadding: string,
  classSelector: string,
  locationSelector: string,
  bgColor: string,
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
  globalColor: string,
  golbalBackgroundColor: string,
  // shoppingListBtn: Partial<BtnStyle>,
}

export const initState = {
  globalColor: '#3385D6',
  golbalBackgroundColor: '#FEF9F5',
  portalStyle: {
    color: '#3385D6',
    bgColor: '#FEF9F5',
  },
  masqueradeButton: {
    color: '#ED6C03',
    buttonText: '',
    location: '',
    customCss: '',
    horizontalPadding: '',
    verticalPadding: '',
  },
  addQuoteBtn: {
    color: '#444444',
    buttonText: '',
    customCss: '',
    classSelector: '',
    locationSelector: '',
    enabled: true,
  },
  floatingAction: {
    color: '#ed6c02',
    buttonText: '',
    location: '',
    customCss: '',
    horizontalPadding: '',
    verticalPadding: '',
    enabled: false,
  },
  addToAllQuoteBtn: {
    color: '#444444',
    buttonText: '',
    customCss: '',
    classSelector: '',
    locationSelector: '',
    enabled: true,
  },
  shoppingListBtn: {
    color: '#444444',
    buttonText: '',
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
