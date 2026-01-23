import { createContext, Dispatch, ReactNode, useMemo, useReducer } from 'react';

import { Country, State } from '../config';
import { RegisterFields } from '../types';

interface RegisterState {
  contactInformation?: RegisterFields[];
  accountType?: string;
  additionalInformation?: RegisterFields[];
  bcAdditionalInformation?: RegisterFields[];
  bcContactInformation?: RegisterFields[];
  emailMarketingNewsletter?: boolean;
  companyInformation?: RegisterFields[];
  bcCompanyInformation?: RegisterFields[];
  companyExtraFields?: RegisterFields[];
  companyAttachment?: RegisterFields[];
  addressBasicFields?: RegisterFields[];
  bcAddressBasicFields?: RegisterFields[];
  addressExtraFields?: RegisterFields[];
  countryList?: Country[];
  stateList?: State[];
  passwordInformation?: RegisterFields[];
  bcPasswordInformation?: RegisterFields[];
  isLoading?: boolean;
  submitSuccess?: boolean;
  isAutoApproval?: boolean;
  blockPendingAccountOrderCreation?: boolean;
  bcTob2bContactInformation?: RegisterFields[];
  bcTob2bCompanyExtraFields?: RegisterFields[];
  bcTob2bCompanyInformation?: RegisterFields[];
  bcTob2bAddressBasicFields?: RegisterFields[];
}

interface RegisterAction {
  type: string;
  payload: RegisterState;
}

interface RegisterContext {
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
