import type { Dispatch, ReactNode } from 'react';

/**
 * Form field shape used in Registered state. Aligned with RegisterFieldsItems from
 * @/utils/registerUtils so that getAccountFormFields() results can be stored without casts.
 * All properties except name are optional so that RegisterFieldsItems is assignable here.
 * Extra optional props (isTip, tipText, isChecked, filesLimit, maxFileSize) are used by
 * the registration UI and attachment field config.
 */
export interface RegisterFields {
  name: string;
  id?: string | number;
  label?: string;
  required?: boolean;
  default?: string | number | Array<string> | unknown[];
  fieldType?: string | number;
  xs?: number;
  visible?: boolean;
  custom?: boolean;
  bcLabel?: string;
  fieldId?: string;
  groupId?: string | number;
  groupName?: string;
  options?: unknown;
  disabled?: boolean;
  replaceOptions?: { label: string; value: string };
  isTip?: boolean;
  tipText?: string;
  isChecked?: boolean;
  filesLimit?: number;
  maxFileSize?: number;
}

export interface Country {
  countryCode: string;
  countryName: string;
  id?: string;
  states: State[];
}

export interface State {
  stateCode?: string;
  stateName?: string;
  id?: string;
}

export interface RegisterState {
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
  blockPendingAccountOrderCreation?: boolean;
  bcTob2bContactInformation?: Array<RegisterFields>;
  bcTob2bCompanyExtraFields?: Array<RegisterFields>;
  bcTob2bCompanyInformation?: Array<RegisterFields>;
  bcTob2bAddressBasicFields?: Array<RegisterFields>;
}

export interface RegisterAction {
  type: string;
  payload: RegisterState;
}

export interface RegisterContext {
  state: RegisterState;
  dispatch: Dispatch<RegisterAction>;
}

export interface RegisteredProviderProps {
  children: ReactNode;
}
