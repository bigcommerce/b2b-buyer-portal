import { createContext, Dispatch, ReactNode, useMemo, useReducer } from 'react';

import { Country, State } from '../config';
import { RegisterFields } from '../types';

interface RegisterState {
  contactInformation?: Array<RegisterFields>;
  accountType?: string;
  additionalInformation?: Array<RegisterFields>;
  bcAdditionalInformation?: Array<RegisterFields>;
  bcContactInformation?: Array<RegisterFields>;
  emailMarketingNewsletter?: boolean;
  companyInformation?: Array<RegisterFields>;
  bcCompanyInformation?: Array<RegisterFields>;
  companyExtraFields?: Array<RegisterFields>;
  companyAttachment?: Array<RegisterFields>;
  addressBasicFields?: Array<RegisterFields>;
  bcAddressBasicFields?: Array<RegisterFields>;
  addressExtraFields?: Array<RegisterFields>;
  countryList?: Array<Country>;
  stateList?: Array<State>;
  passwordInformation?: Array<RegisterFields>;
  bcPasswordInformation?: Array<RegisterFields>;
  isLoading?: boolean;
  submitSuccess?: boolean;
  isAutoApproval?: boolean;
  storeName?: string;
  blockPendingAccountOrderCreation?: boolean;
  bcTob2bContactInformation?: Array<RegisterFields>;
  bcTob2bCompanyExtraFields?: Array<RegisterFields>;
  bcTob2bCompanyInformation?: Array<RegisterFields>;
  bcTob2bAddressBasicFields?: Array<RegisterFields>;
}
interface RegisterAction {
  type: string;
  payload: RegisterState;
}
export interface RegisterContext {
  state: RegisterState;
  dispatch: Dispatch<RegisterAction>;
}

interface RegisteredProviderProps {
  children: ReactNode;
}

const initState = {
  contactInformation: [],
  bcContactInformation: [],
  additionalInformation: [],
  bcAdditionalInformation: [],
  passwordInformation: [],
  bcPasswordInformation: [],
  accountType: '',
  emailMarketingNewsletter: false,
  companyInformation: [],
  bcCompanyInformation: [],
  companyExtraFields: [],
  companyAttachment: [],
  addressBasicFields: [],
  bcAddressBasicFields: [],
  addressExtraFields: [],
  countryList: [],
  stateList: [],
  isLoading: false,
  storeName: '',
  submitSuccess: false,
  isAutoApproval: true,
  blockPendingAccountOrderCreation: true,
  bcTob2bContactInformation: [],
  bcTob2bCompanyExtraFields: [],
  bcTob2bCompanyInformation: [],
  bcTob2bAddressBasicFields: [],
};

export const RegisteredContext = createContext<RegisterContext>({
  state: initState,
  dispatch: () => {},
});

const reducer = (state: RegisterState, action: RegisterAction) => {
  switch (action.type) {
    case 'all':
      return {
        ...state,
        ...action.payload,
      };
    case 'loading':
      return {
        ...state,
        ...action.payload,
      };
    case 'contactInformation':
      return {
        ...state,
        contactInformation: action.payload.contactInformation,
      };
    case 'accountType':
      return {
        ...state,
        accountType: action.payload.accountType,
      };
    case 'emailSletter':
      return {
        ...state,
        emailMarketingNewsletter: action.payload.emailMarketingNewsletter,
      };
    case 'stateList':
      return {
        ...state,
        stateList: action.payload.stateList,
        addressBasicFields: action.payload.addressBasicFields,
        bcAddressBasicFields: action.payload.bcAddressBasicFields,
        bcTob2bAddressBasicFields: action.payload.bcTob2bAddressBasicFields,
      };
    case 'finishInfo':
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

export function RegisteredProvider(props: RegisteredProviderProps) {
  const [state, dispatch] = useReducer(reducer, initState);

  const { children } = props;

  const registerValue = useMemo(
    () => ({
      state,
      dispatch,
    }),
    [state],
  );

  return <RegisteredContext.Provider value={registerValue}>{children}</RegisteredContext.Provider>;
}
