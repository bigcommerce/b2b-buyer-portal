import { UseFormSetError } from 'react-hook-form';
import { format } from 'date-fns/format';

import { LangFormatFunction } from '@/lib/lang';
import { validateAddressExtraFields, validateBCCompanyExtraFields } from '@/shared/service/b2b';
import { getLineNumber } from '@/utils/b3GetTextLenPX';
import { validatorRules } from '@/utils/validatorRules';

import { RegisterFields } from './types';

const inputFormat = 'yyyy-MM-dd';

interface ValidateOptionItems extends Record<string, any> {
  max?: number;
  min?: number;
}

type ContactInformationItems = Array<RegisterFields>;
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

type AccountFormFieldsList = Array<[]> | Array<AccountFormFieldsItems>;

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

export const steps = [
  'register.step.account',
  'register.step.details',
  'register.step.finish',
] as const;

const companyExtraFieldsType = ['text', 'multiline', 'number', 'dropdown'];

export const Base64 = {
  encode(str: string | number | boolean) {
    return window.btoa(encodeURIComponent(str));
  },
  decode(str: string) {
    return decodeURIComponent(window.atob(str));
  },
};

const fieldsType = {
  text: ['text', 'number', 'password', 'multiline'],
  checkbox: ['checkbox'],
  dropdown: ['dropdown'],
  radio: ['radio'],
  date: ['date'],
};

const classificationType = (item: CustomFieldItems) => {
  let optionItems: ValidateOptionItems = {};
  if (fieldsType.text.includes(item.fieldType)) {
    optionItems = {
      minlength: item.minlength || null,
      maxLength: item.maxLength || Number(item.maximumLength) || null,
      min: item.min || null,
      max: item.max || Number(item.maximumValue) || null,
      rows: item?.options?.rows || item.numberOfRows || null,
    };
    if (optionItems?.max) {
      optionItems.validate = validatorRules(['max'], {
        max: optionItems?.max,
      });
    }

    if (item.fieldType === 'password') {
      optionItems.validate = validatorRules(['password']);
    }

    if (item?.fieldName === 'email' || item?.fieldName === 'phone') {
      optionItems.validate = validatorRules([item.fieldName]);
    }
    if (item.fieldType === 'number' || (item.fieldType === 'text' && item.type === 'integer')) {
      optionItems.validate = validatorRules(['number']);
    }
  }
  if (fieldsType.checkbox.includes(item.fieldType)) {
    optionItems = {
      default: item.default || [],
      options: item.options?.items || null,
    };
  }
  if (fieldsType.dropdown.includes(item.fieldType)) {
    const items = [];
    if (item.options?.helperLabel) {
      items.push({
        label: item.options.helperLabel,
        value: '',
      });
    }
    const options = [...items, ...(item.options?.items || [])];

    if (item.listOfValue) {
      item.listOfValue.forEach((value: any) =>
        options.push({
          label: value,
          value,
        }),
      );
    }

    optionItems = {
      default: item.default || '',
      options: options || null,
    };
  }
  if (fieldsType.radio.includes(item.fieldType)) {
    optionItems = {
      default: item.default || '',
      options: item.options?.items || [],
    };
  }

  if (optionItems?.options) {
    optionItems?.options.forEach((option: any) => {
      const optionValue = option;
      if (option.value) {
        optionValue.value = option.label;
      }
    });
  }

  if (item.fieldId === 'field_country') {
    optionItems.default = item.valueConfigs?.default || optionItems.default;
  }

  return optionItems;
};

const noEncryptFieldList = ['country', 'state', 'email'];
export const b2bAddressRequiredFields = [
  'field_country',
  'field_address_1',
  'field_city',
  'field_state',
  'field_zip_code',
];

const groupItems = {
  1: 'contactInformation',
  2: 'additionalInformation',
  3: 'businessDetails',
  4: 'address',
  5: 'password',
};

export const deCodeField = (fieldName: string) => {
  if (noEncryptFieldList.includes(fieldName)) {
    return fieldName;
  }
  return Base64.decode(fieldName);
};

const enCodeFieldName = (fieldName: string) => {
  if (noEncryptFieldList.includes(fieldName)) {
    return fieldName;
  }

  return Base64.encode(fieldName);
};

const bcFieldName = (fieldName: string) => {
  if (fieldName === 'countryCode') {
    return 'country';
  }
  if (fieldName === 'stateOrProvince') {
    return 'state';
  }
  return fieldName;
};

const conversionSingleItem = (item: CustomFieldItems): Partial<RegisterFieldsItems> => {
  const requiredItems = {
    id: item.id || item.fieldName,
    name: bcFieldName(item.name) || enCodeFieldName(item.fieldName),
    label: item.label || item.labelName,
    required: item.required || item.isRequired,
    default: item.default || item.defaultValue || '',
    fieldType: item.fieldType,
    xs: 12,
    visible: item?.visible || false,
    custom: item?.custom || false,
    bcLabel: item.label || '',
    type: item.type || '',
  };

  const customFieldItem = item;

  if (typeof item.fieldType === 'number') {
    customFieldItem.fieldType = companyExtraFieldsType[item.fieldType];
    requiredItems.fieldType = item.fieldType;
  }

  const optionItems = classificationType(item);

  return {
    ...requiredItems,
    ...optionItems,
  };
};

export const toHump = (name: string) => name.replace(/_(\w)/g, (_, letter) => letter.toUpperCase());

const conversionItemFormat = (FormFields: AccountFormFieldsList) => {
  const getFormFields: any = {};

  FormFields.forEach((item: CustomFieldItems) => {
    const key: string = (groupItems as CustomFieldItems)[item.groupId];

    if (!getFormFields[key]?.length) {
      getFormFields[key] = [];
    }

    let obj: CustomFieldItems = {};
    if (item.valueConfigs?.id) {
      obj = conversionSingleItem(item.valueConfigs);
    } else {
      obj = conversionSingleItem(item);
    }

    obj.required = item.isRequired;
    obj.id = item.id;
    obj.fieldId = item.fieldId;
    obj.groupId = item.groupId;
    obj.groupName = item.groupName;
    obj.visible = item.visible;
    obj.label = item.labelName;
    obj.custom = obj.custom || item?.custom;
    obj.variant = 'filled';

    if (obj.fieldType === 'date' && !obj.default) {
      obj.default = format(new Date(), inputFormat);
    }

    if (obj.name === 'country') {
      obj.replaceOptions = {
        label: 'countryName',
        value: 'countryCode',
      };
    }

    if (obj.name === 'state') {
      obj.replaceOptions = {
        label: 'stateName',
        value: 'stateName',
      };
    }

    if (item.fieldId === 'field_confirm_password') {
      obj.name = 'confirmPassword';
    }
    if (obj.fieldType === 'files') {
      obj.filesLimit = 3;
      obj.maxFileSize = 10485760;
      obj.default = [];
    }

    if (obj.fieldType === 'checkbox' && !obj.options) {
      obj.label = '';
      obj.options = [
        {
          label: item.labelName,
          value: item.labelName,
        },
      ];
    }

    if (obj.fieldType === 'text' && obj.type === 'integer') {
      obj.fieldType = 'number';
    }

    if (obj.label.length > 0) {
      let originPaddingTop = 25;
      const isMobile = document.body.clientWidth <= 750;
      let lineNumber = getLineNumber(obj.label, 16);

      if (obj.fieldType === 'multiline') {
        originPaddingTop = 0;
      }
      if (obj.fieldType === 'dropdown') {
        originPaddingTop = 0;
        if (lineNumber > 1) {
          lineNumber += isMobile ? 1.4 : 2;
        }

        if (obj.fieldId === 'field_state') {
          lineNumber -= isMobile ? 0 : 0.8;
        }
      }

      const paddingTopVal =
        lineNumber === 1
          ? `${originPaddingTop}px`
          : `${originPaddingTop / 16 + (lineNumber - 1)}rem`;
      if (lineNumber > 0) {
        obj.extraPadding = {
          paddingTop: paddingTopVal,
        };
      }
    }

    getFormFields[key].push(obj);
  });

  return getFormFields;
};

export const getAccountFormFields = (accountFormFields: AccountFormFieldsList) => {
  if (accountFormFields?.length) {
    const filterVisibleAccountFormFields: AccountFormFieldsList = accountFormFields
      ? (accountFormFields as any).filter(
          (item: Partial<AccountFormFieldsItems>) =>
            !!item.visible || (!!item.custom && !!item.isRequired),
        )
      : [];

    const getAccountFormItems = filterVisibleAccountFormFields
      ? conversionItemFormat(filterVisibleAccountFormFields)
      : {};

    return getAccountFormItems;
  }
  return {};
};

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
        fieldValue: data[field.name] || field.default,
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
