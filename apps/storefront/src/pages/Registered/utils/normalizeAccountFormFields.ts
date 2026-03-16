import type { LangFormatFunction } from '@/lib/lang';
import { getB2BAccountFormFields, getB2BCountries } from '@/shared/service/b2b';

import { b2bAddressRequiredFields, FORM_TYPES } from '../constants';
import type {
  AccountFormFieldsItems,
  NormalizedFormFields,
  RegisterFields,
  RegisterFieldsItems,
  RegisterState,
} from '../types';

import { getAccountFormFields } from './formFieldConversion';

function companyAttachmentsFields(b3lang: LangFormatFunction): Array<RegisterFields> {
  return [
    {
      name: 'companyAttachments',
      label: b3lang('register.label.companyAttachments'),
      default: [],
      fieldType: 'file',
      required: false,
      xs: 12,
      filesLimit: 3,
      maxFileSize: 10485760, // 10M
    },
  ];
}

function applyB2BAddressRequiredFields(fields: AccountFormFieldsItems[]): AccountFormFieldsItems[] {
  return fields.map((formFields) => {
    const isAddressRequired =
      b2bAddressRequiredFields.includes(formFields?.fieldId ?? '') && formFields.groupId === 4;
    return isAddressRequired ? { ...formFields, isRequired: true, visible: true } : formFields;
  });
}

function mergeB2BAddressWithCountries(
  addressFields: Partial<RegisterFieldsItems>[] | undefined,
  countries: NormalizedFormFields['countries'],
): Partial<RegisterFieldsItems>[] {
  if (!addressFields?.length) return [];
  return addressFields.map((addressFieldsItem) => {
    if (addressFieldsItem.name !== 'country') return addressFieldsItem;
    return {
      ...addressFieldsItem,
      options: countries,
      replaceOptions: { label: 'countryName', value: 'countryName' },
    };
  });
}

function mergeBCAddressWithCountries(
  addressFields: Partial<RegisterFieldsItems>[] | undefined,
  countries: NormalizedFormFields['countries'],
): Partial<RegisterFieldsItems>[] {
  if (!addressFields?.length) return [];
  return addressFields.map((addressFieldsItem) => {
    if (addressFieldsItem.name !== 'country') return addressFieldsItem;
    const countryDefaultValue = countries.find((c) => c.countryName === addressFieldsItem.default);
    return {
      ...addressFieldsItem,
      options: countries,
      default: countryDefaultValue?.countryCode ?? addressFieldsItem.default,
    };
  });
}

export async function loadAndNormalizeAccountFormFields(): Promise<NormalizedFormFields> {
  const accountFormAllFields = FORM_TYPES.map((type) => getB2BAccountFormFields(type));
  const accountFormFields = await Promise.all(accountFormAllFields);
  const { countries } = await getB2BCountries();

  const rawB2BFields = (accountFormFields[1]?.accountFormFields || []) as AccountFormFieldsItems[];
  const newB2bAccountFormFields = applyB2BAddressRequiredFields(rawB2BFields);
  const bcAccountFormFields = getAccountFormFields(
    (accountFormFields[0]?.accountFormFields || []) as Parameters<typeof getAccountFormFields>[0],
  );
  const b2bAccountFormFields = getAccountFormFields(
    newB2bAccountFormFields as Parameters<typeof getAccountFormFields>[0],
  );

  const newAddressInformationFields = mergeB2BAddressWithCountries(
    b2bAccountFormFields.address,
    countries,
  );
  const newBCAddressInformationFields = mergeBCAddressWithCountries(
    bcAccountFormFields.address,
    countries,
  );

  return {
    b2bAccountFormFields,
    bcAccountFormFields,
    countries,
    newAddressInformationFields,
    newBCAddressInformationFields,
  };
}

export function buildInitialRegisterStatePayload(
  normalized: NormalizedFormFields,
  accountLoginRegistration: { b2b?: boolean; b2c?: boolean },
  b3Lang: LangFormatFunction,
): Partial<RegisterState> {
  const accountB2cEnabledInfo = accountLoginRegistration.b2c && !accountLoginRegistration.b2b;
  const b2b = normalized.b2bAccountFormFields;
  const bc = normalized.bcAccountFormFields;

  return {
    accountType: accountB2cEnabledInfo ? '2' : '1',
    isLoading: false,
    submitSuccess: false,
    contactInformation: [...(b2b.contactInformation || [])],
    bcContactInformation: [...(bc.contactInformation || [])],
    additionalInformation: [...(b2b.additionalInformation || [])],
    bcAdditionalInformation: [...(bc.additionalInformation || [])],
    companyExtraFields: [],
    companyInformation: [...(b2b?.businessDetails || [])],
    companyAttachment: [...companyAttachmentsFields(b3Lang)],
    addressBasicFields: [...normalized.newAddressInformationFields],
    bcAddressBasicFields: [...normalized.newBCAddressInformationFields],
    countryList: [...normalized.countries],
    passwordInformation: [...(b2b.password || [])],
    bcPasswordInformation: [...(bc.password || [])],
    // Runtime shape from getAccountFormFields/normalized form is compatible with RegisterState; cast for type overlap (countryList, fieldType, etc.).
  } as unknown as Partial<RegisterState>;
}
