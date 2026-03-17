import type { Dispatch, ReactNode } from 'react';

export interface RegisterFields extends Record<string, any> {
  name: string;
  label?: string;
  required?: boolean;
  fieldType?: string;
  default?: string | Array<any> | number | object;
}

interface FieldSXConfigs {
  [key: string]: string | number;
}

interface AccountFormFieldsItemsValueConfigs {
  defaultValue?: string;
  fieldName?: string;
  isRequired?: boolean;
  labelName?: string;
  maximumLength?: string;
  maxLength?: string;
  name?: string;
  required?: string;
  type?: string;
  custom?: boolean;
  id: string | number;
}

export interface AccountFormFieldsItems {
  fieldId?: string;
  fieldName?: string;
  fieldType?: string | number;
  groupId: number | string;
  groupName?: string;
  id?: string;
  isRequired?: boolean;
  labelName?: string;
  visible?: boolean;
  custom?: boolean;
  valueConfigs?: AccountFormFieldsItemsValueConfigs;
  sx?: FieldSXConfigs;
}

export type AccountFormFieldsList = Array<[]> | Array<AccountFormFieldsItems>;

interface ReplaceOptionsProps {
  label: string;
  value: string;
}

export interface RegisterFieldsItems {
  id?: string | number;
  name: string;
  label: string;
  required: boolean;
  default: string | number | Array<string>;
  fieldType: string | number;
  xs: number;
  visible: boolean;
  custom: boolean;
  bcLabel?: string;
  fieldId: string;
  groupId: string | number;
  groupName: string;
  options?: any;
  disabled: boolean;
  replaceOptions?: ReplaceOptionsProps;
}

export interface Country {
  countryCode: string;
  countryName: string;
  id?: string;
  states: [];
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
  payload: Partial<RegisterState>;
}

export interface RegisterContext {
  state: RegisterState;
  dispatch: Dispatch<RegisterAction>;
}

export interface RegisteredProviderProps {
  children: ReactNode;
}

export type AccountFormFieldsResult = Record<string, Partial<RegisterFieldsItems>[]>;

export interface NormalizedFormFields {
  b2bAccountFormFields: AccountFormFieldsResult;
  bcAccountFormFields: AccountFormFieldsResult;
  countries: Array<
    Record<string, unknown> & { countryCode?: string; countryName?: string; states?: unknown[] }
  >;
  newAddressInformationFields: Partial<RegisterFieldsItems>[];
  newBCAddressInformationFields: Partial<RegisterFieldsItems>[];
}

export interface B2BCompanyPayloadInput {
  contactList: RegisterFields[] | undefined;
  companyInformation: RegisterFields[];
  addressBasicList: RegisterFields[];
  customerId: number | string;
  customerEmail: string;
  fileList: CustomFieldItems[] | undefined;
}

export interface BCUserPayloadInput {
  list: RegisterFields[] | undefined;
  additionalInfo: RegisterFields[] | undefined;
  addressBasicList: RegisterFields[] | undefined;
  accountType: string;
  data: CustomFieldItems;
  emailMarketingNewsletter: boolean | unknown;
}

export interface AttachmentsValidationResult {
  hasError: boolean;
  field?: RegisterFields;
}

interface UploadFileResponse {
  code: number;
  data?: { errMsg?: string; fileSize?: string; [key: string]: unknown };
  message?: string;
}

export type UploadedFileListItem = Record<string, unknown>;

export type UploadB2BFileFn = (params: { file: File; type: string }) => Promise<UploadFileResponse>;

export interface SubscribersPayload {
  storeHash: string;
  email: string;
  first_name: string;
  last_name: string;
  channel_id: number;
  source?: string;
  order_id?: number;
}
