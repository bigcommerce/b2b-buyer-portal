import { Dispatch, ReactNode } from 'react'

type BtnKeys =
  | 'masqueradeButton'
  | 'floatingAction'
  | 'addToAllQuoteBtn'
  | 'shoppingListBtn'
  | 'portalStyle'
  | 'loginPageButton'
  | 'loginPageDisplay'
  | 'loginPageHtml'
  | 'accountLoginRegistration'
  | 'companyAutoApproval'
  | 'cssOverride'
  | 'quoteOnNonPurchasableProductPageBtn'

interface BtnStyle {
  color: string
  text: string
  buttonText: string
  location: string
  customCss: string
  horizontalPadding: string
  verticalPadding: string
  classSelector: string
  locationSelector: string
  backgroundColor: string
  primaryColor: string
  enabled: boolean
  b2b: boolean
  b2c: boolean
  createAccountButtonText?: string
  primaryButtonColor?: string
  signInButtonText?: string
  displayStoreLogo?: boolean
  pageTitle?: string
  bottomHtmlRegionEnabled?: boolean
  bottomHtmlRegionHtml?: string
  createAccountPanelHtml?: string
  topHtmlRegionEnabled?: boolean
  topHtmlRegionHtml?: string
  css?: string
}

export interface BtnProperties {
  classSelector: string
  color: string
  customCss: string
  enabled: boolean
  locationSelector: string
  text: string
}

export interface CustomStyleButtonState
  extends Record<BtnKeys, Partial<BtnStyle>> {
  addQuoteBtn: BtnProperties
  shoppingListBtn: BtnProperties
  addToAllQuoteBtn: BtnProperties
  quoteOnNonPurchasableProductPageBtn: BtnProperties
  globalButtonBackgroundColor: string
}

export const defaultCreateAccountPanel = `<div class="panel">
<div class="panel-header">
    <h2 class="panel-title">New Customer?</h2>
</div>
<div class="panel-body">
    <p class="new-customer-intro">Create an account with us and you'll be able to:</p>
    <ul class="new-customer-fact-list">
        <li class="new-customer-fact">Check out faster</li>
        <li class="new-customer-fact">Save multiple shipping addresses</li>
        <li class="new-customer-fact">Access your order history</li>
        <li class="new-customer-fact">Track new orders</li>
        <li class="new-customer-fact">Save items to your Wish List</li>
    </ul>
</div>
</div>
`

export const initState = {
  globalButtonBackgroundColor: '#3385D6',
  portalStyle: {
    primaryColor: '#3385D6',
    backgroundColor: '#FEF9F5',
  },
  masqueradeButton: {
    color: '#FFFFFF',
    text: 'END MASQUERADE',
    location: 'bottomLeft',
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
  quoteOnNonPurchasableProductPageBtn: {
    color: '#fff',
    text: 'Add to 1 Quote',
    customCss: '',
    classSelector: '',
    locationSelector: '',
    enabled: true,
  },
  floatingAction: {
    color: '#3385d6',
    text: 'Finish quote',
    buttonText: 'Finish quote',
    location: 'bottomRight',
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
    pageTitle: 'Sign In',
  },
  loginPageHtml: {
    bottomHtmlRegionEnabled: false,
    bottomHtmlRegionHtml: '',
    createAccountPanelHtml: defaultCreateAccountPanel,
    enabled: true,
    topHtmlRegionEnabled: false,
    topHtmlRegionHtml: '',
  },
  accountLoginRegistration: {
    b2b: true,
    b2c: true,
  },
  companyAutoApproval: {
    enabled: true,
  },
  cssOverride: {
    css: '',
  },
}

export interface CustomStyleButtonAction {
  type: string
  payload: Partial<CustomStyleButtonState>
}

export type DispatchProps = Dispatch<Partial<CustomStyleButtonAction>>
export interface CustomStyleButtonContext {
  state: CustomStyleButtonState
  dispatch: DispatchProps
}

export interface CustomStyleButtonProviderProps {
  children: ReactNode
}
