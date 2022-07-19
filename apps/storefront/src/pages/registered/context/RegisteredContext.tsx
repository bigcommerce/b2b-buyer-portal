import React, {
  useReducer, createContext, Dispatch, ReactNode, useMemo,
} from 'react'

import { RegisterFileds, Country, State } from '../config'

interface RegisterState {
  contactInformation?: Array<RegisterFileds> | Array<[]>,
  accountType?: string,
  additionalInformation?: Array<RegisterFileds> | Array<[]>,
  bcContactInformationFields?: Array<RegisterFileds> | Array<[]>,
  emailMarketingNewsletter?: Boolean,
  companyInformation?: Array<RegisterFileds> | Array<[]>,
  companyAttachment?: Array<RegisterFileds> | Array<[]>,
  addressBasicFields?: Array<RegisterFileds> | Array<[]>,
  addressExtraFields?: Array<RegisterFileds> | Array<[]>,
  countryList?: Array<Country>,
  stateList?: Array<State>,
  passwordInformation?: Array<RegisterFileds> | Array<[]>,
  isLoading?: Boolean,
}
interface RegisterAction {
  type: string,
  payload: RegisterState
}
export interface RegisterContext {
  state: RegisterState,
  dispatch: Dispatch<RegisterAction>,
}

interface RegisteredProviderProps {
  children: ReactNode
}

const initState = {
  contactInformation: [],
  bcContactInformation: [],
  additionalInformation: [],
  passwordInformation: [],
  accountType: '',
  emailMarketingNewsletter: false,
  companyInformation: [],
  companyAttachment: [],
  addressBasicFields: [],
  addressExtraFields: [],
  countryList: [],
  stateList: [],
  isLoading: false,
}

export const RegisteredContext = createContext<RegisterContext>({ state: initState, dispatch: () => {} })

const reducer = (state: RegisterState, action: RegisterAction) => {
  switch (action.type) {
    case 'all':
      return { ...state, ...action.payload }
    case 'loading':
      return { ...state, ...action.payload }
    case 'contactInformation':
      return { ...state, contactInformation: action.payload.contactInformation }
    case 'accountType':
      return { ...state, accountType: action.payload.accountType }
    case 'emailSletter':
      return { ...state, emailMarketingNewsletter: action.payload.emailMarketingNewsletter }
    case 'stateList':
      return { ...state, stateList: action.payload.stateList, addressBasicFields: action.payload.addressBasicFields }
    default:
      return state
  }
}

export function RegisteredProvider(props: RegisteredProviderProps) {
  const [state, dispatch] = useReducer(reducer, initState)

  const { children } = props

  const registerValue = useMemo(() => ({ state, dispatch }), [state])

  return (
    <RegisteredContext.Provider value={registerValue}>
      {children}
    </RegisteredContext.Provider>
  )
}
