import { UseFormSetError } from 'react-hook-form';

import { LangFormatFunction } from '@/lib/lang';
import { validateAddressExtraFields, validateBCCompanyExtraFields } from '@/shared/service/b2b';
import { Base64 } from '@/utils/base64';

import { RegisterFields } from './types';

type ContactInformationItems = Array<RegisterFields>;

export const steps = [
  'register.step.account',
  'register.step.details',
  'register.step.finish',
] as const;

export const b2bAddressRequiredFields = [
  'field_country',
  'field_address_1',
  'field_city',
  'field_state',
  'field_zip_code',
];

export const companyAttachmentsFields = (b3lang: LangFormatFunction): ContactInformationItems => [
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

type EmailError = {
  [k: number]: string;
};

export const emailError: EmailError = {
  2: 'register.emailValidate.alreadyExitsBC',
  3: 'global.emailValidate.multipleCustomer',
  4: 'global.emailValidate.companyUsed',
  5: 'global.emailValidate.alreadyExits',
  6: 'global.emailValidate.usedSuperAdmin',
};

interface ValidateExtraFieldsProps {
  fields: RegisterFields[];
  data: CustomFieldItems;
  type: 'company' | 'address';
  setError: UseFormSetError<CustomFieldItems>;
}

export const validateExtraFields = async ({
  fields,
  data,
  type,
  setError,
}: ValidateExtraFieldsProps) => {
  return new Promise((resolve, reject) => {
    const init = async () => {
      const customFields = fields.filter((item) => !!item.custom);

      const extraFields = customFields.map((field: RegisterFields) => ({
        fieldName: Base64.decode(field.name),
        fieldValue: data[field.name] ?? field.default,
      }));

      const fn = type === 'company' ? validateBCCompanyExtraFields : validateAddressExtraFields;

      const result = await fn({
        extraFields,
      });

      if (result.code !== 200) {
        const message = result.data?.errMsg || result.message || '';

        const messageArr = message.split(':');

        if (messageArr.length >= 2) {
          const field = customFields.find((field) => Base64.decode(field.name) === messageArr[0]);
          if (field) {
            setError(field.name, {
              type: 'manual',
              message: messageArr[1],
            });
          }
        }
        reject(message);
      }
      resolve(result);
    };

    init();
  });
};
