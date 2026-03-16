import { format } from 'date-fns/format';

import { getLineNumber } from '@/utils/b3GetTextLenPX';
import { Base64 } from '@/utils/base64';
import { validatorRules } from '@/utils/validatorRules';

import { groupItems, noEncryptFieldList } from '../constants';
import type {
  AccountFormFieldsItems,
  AccountFormFieldsList,
  AccountFormFieldsResult,
  RegisterFieldsItems,
} from '../types';

export function deCodeField(fieldName: string): string {
  if (noEncryptFieldList.includes(fieldName)) {
    return fieldName;
  }
  return Base64.decode(fieldName);
}

export function toHump(name: string): string {
  return name.replace(/_(\w)/g, (_, letter) => letter.toUpperCase());
}

const inputFormat = 'yyyy-MM-dd';
const companyExtraFieldsType = ['text', 'multiline', 'number', 'dropdown'];

interface ValidateOptionItems extends Record<string, unknown> {
  max?: number;
  min?: number;
}

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
      (item.listOfValue as Array<string | number>).forEach((value: string | number) =>
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
    (optionItems.options as Array<{ label: string; value?: string }>).forEach((option) => {
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

function enCodeFieldName(fieldName: string) {
  if (noEncryptFieldList.includes(fieldName)) {
    return fieldName;
  }
  return Base64.encode(fieldName);
}

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

const conversionItemFormat = (FormFields: AccountFormFieldsList) => {
  const getFormFields: AccountFormFieldsResult = {};

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

export function getAccountFormFields(accountFormFields: AccountFormFieldsList) {
  if (accountFormFields?.length) {
    const filterVisibleAccountFormFields: AccountFormFieldsList = accountFormFields
      ? (accountFormFields as AccountFormFieldsItems[]).filter(
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
}
