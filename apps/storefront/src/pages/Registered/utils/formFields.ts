import type { LangFormatFunction } from '@/lib/lang';
import { getB2BAccountFormFields, getB2BCountries } from '@/shared/service/b2b';
import {
  type AccountFormFieldsItems,
  B2B_ADDRESS_REQUIRED_FIELDS,
  getAccountFormFields,
  type RegisterFieldsItems,
} from '@/utils/registerUtils';

import { FORM_TYPES } from '../constants';
import type { Country, RegisterFields, RegisterState } from '../types';

function companyAttachmentsFields(b3lang: LangFormatFunction): RegisterFields[] {
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

export function setRegisterFieldsFromFormData(
  formFields: RegisterFields[],
  formData: Record<string, unknown>,
): RegisterFields[] {
  return formFields.map((field) => ({
    ...field,
    default: (formData[field.name] || field.default) as string | unknown[] | number | undefined,
  }));
}

export function buildDetailsFormValues(
  fields: RegisterFields[],
  getValue: (name: string) => unknown,
): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((formValues, field) => {
    formValues[field.name] = getValue(field.name) || field.default;
    return formValues;
  }, {});
}

interface NormalizedAccountFormFields {
  b2bAccountFormFields: {
    contactInformation?: RegisterFieldsItems[];
    additionalInformation?: RegisterFieldsItems[];
    businessDetails?: RegisterFieldsItems[];
    address?: RegisterFieldsItems[];
    password?: RegisterFieldsItems[];
  };
  bcAccountFormFields: {
    contactInformation?: RegisterFieldsItems[];
    additionalInformation?: RegisterFieldsItems[];
    businessDetails?: RegisterFieldsItems[];
    address?: RegisterFieldsItems[];
    password?: RegisterFieldsItems[];
  };
  newAddressInformationFields: Partial<RegisterFieldsItems>[];
  newBCAddressInformationFields: Partial<RegisterFieldsItems>[];
  countries: Country[];
}

export async function loadAndNormalizeAccountFormFields(): Promise<NormalizedAccountFormFields> {
  const accountFormAllFields = FORM_TYPES.map((item) => getB2BAccountFormFields(item));
  const accountFormFields = await Promise.all(accountFormAllFields);

  const newB2bAccountFormFields: AccountFormFieldsItems[] = (
    accountFormFields[1]?.accountFormFields || []
  ).map((fields: AccountFormFieldsItems) => {
    const formFields = { ...fields };
    if (B2B_ADDRESS_REQUIRED_FIELDS.includes(fields?.fieldId || '') && fields.groupId === 4) {
      formFields.isRequired = true;
      formFields.visible = true;
    }
    return formFields;
  });

  const bcAccountFormFields = getAccountFormFields(accountFormFields[0]?.accountFormFields || []);
  const b2bAccountFormFields = getAccountFormFields(newB2bAccountFormFields || []);

  const { countries } = await getB2BCountries();

  const newAddressInformationFields =
    b2bAccountFormFields.address?.map(
      (addressFields: Partial<RegisterFieldsItems>): Partial<RegisterFieldsItems> => {
        const fields = { ...addressFields };
        if (addressFields.name === 'country') {
          fields.options = countries;
          fields.replaceOptions = {
            label: 'countryName',
            value: 'countryName',
          };
        }
        return fields;
      },
    ) || [];

  const newBCAddressInformationFields =
    bcAccountFormFields.address?.map(
      (addressFields: Partial<RegisterFieldsItems>): Partial<RegisterFieldsItems> => {
        const addressFormFields = { ...addressFields };
        if (addressFields.name === 'country') {
          addressFormFields.options = countries;
          const countryDefaultValue = countries.find(
            (country: CustomFieldItems) => country.countryName === addressFields.default,
          );
          addressFormFields.default = countryDefaultValue?.countryCode || addressFields.default;
        }
        return addressFormFields;
      },
    ) || [];

  return {
    b2bAccountFormFields,
    bcAccountFormFields,
    newAddressInformationFields,
    newBCAddressInformationFields,
    countries,
  };
}

interface AccountLoginRegistration {
  b2b?: boolean;
  b2c?: boolean;
}

export function buildInitialRegisterStatePayload(
  normalized: NormalizedAccountFormFields,
  accountLoginRegistration: AccountLoginRegistration,
  b3Lang: LangFormatFunction,
): RegisterState {
  const { b2b, b2c } = accountLoginRegistration;
  const accountB2cEnabledInfo = b2c && !b2b;

  return {
    accountType: accountB2cEnabledInfo ? '2' : '1',
    isLoading: false,
    contactInformation: [...(normalized.b2bAccountFormFields.contactInformation || [])],
    bcContactInformation: [...(normalized.bcAccountFormFields.contactInformation || [])],
    additionalInformation: [...(normalized.b2bAccountFormFields.additionalInformation || [])],
    bcAdditionalInformation: [...(normalized.bcAccountFormFields.additionalInformation || [])],
    companyExtraFields: [],
    companyInformation: [...(normalized.b2bAccountFormFields?.businessDetails || [])],
    companyAttachment: [...companyAttachmentsFields(b3Lang)],
    addressBasicFields: normalized.newAddressInformationFields as RegisterFields[],
    bcAddressBasicFields: normalized.newBCAddressInformationFields as RegisterFields[],
    countryList: [...normalized.countries],
    passwordInformation: [...(normalized.b2bAccountFormFields.password || [])],
    bcPasswordInformation: [...(normalized.bcAccountFormFields.password || [])],
  };
}
