import { format } from 'date-fns/format';

import { getLineNumber } from '@/utils/b3GetTextLenPX';
import { Base64 } from '@/utils/base64';
import { validatorRules } from '@/utils/validatorRules';

const DATE_INPUT_FORMAT = 'yyyy-MM-dd';

interface ValidateOptionItems extends Record<string, unknown> {
  max?: number;
  min?: number;
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
  options?: unknown;
  disabled: boolean;
  replaceOptions?: ReplaceOptionsProps;
}

const noEncryptFieldList = ['country', 'state', 'email'];
const companyExtraFieldsType = ['text', 'multiline', 'number', 'dropdown'];
const fieldsType: Record<string, string[]> = {
  text: ['text', 'number', 'password', 'multiline'],
  checkbox: ['checkbox'],
  dropdown: ['dropdown'],
  radio: ['radio'],
  date: ['date'],
};

const groupItems: Record<number, string> = {
  1: 'contactInformation',
  2: 'additionalInformation',
  3: 'businessDetails',
  4: 'address',
  5: 'password',
};

export function deCodeField(fieldName: string): string {
  if (noEncryptFieldList.includes(fieldName)) {
    return fieldName;
  }
  return Base64.decode(fieldName);
}

export const toHump = (name: string) => name.replace(/_(\w)/g, (_, letter) => letter.toUpperCase());

function enCodeFieldName(fieldName: string): string {
  if (noEncryptFieldList.includes(fieldName)) {
    return fieldName;
  }
  return Base64.encode(fieldName);
}

function bcFieldName(fieldName: string): string {
  if (fieldName === 'countryCode') {
    return 'country';
  }
  if (fieldName === 'stateOrProvince') {
    return 'state';
  }
  return fieldName;
}

function classificationType(item: CustomFieldItems): ValidateOptionItems {
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
    const items: Array<{ label: string; value: string }> = [];
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
          label: String(value),
          value: String(value),
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
}

function conversionSingleItem(item: CustomFieldItems): RegisterFieldsItems {
  const fieldTypeNormalized: string =
    typeof item.fieldType === 'number'
      ? (companyExtraFieldsType[item.fieldType] ?? String(item.fieldType))
      : String(item.fieldType ?? '');

  const requiredItems = {
    id: item.id || item.fieldName,
    name: (bcFieldName(item.name) || enCodeFieldName(item.fieldName)) as string,
    label: item.label || item.labelName,
    required: item.required || item.isRequired,
    default: item.default ?? item.defaultValue ?? '',
    fieldType: fieldTypeNormalized,
    xs: 12,
    visible: item?.visible ?? false,
    custom: item?.custom ?? false,
    bcLabel: item.label || '',
    fieldId: item.fieldId ?? '',
    groupId: item.groupId ?? '',
    groupName: item.groupName ?? '',
    type: item.type || '',
    disabled: !!item.disabled,
  };

  const itemForClassification = { ...item, fieldType: fieldTypeNormalized };
  const optionItems = classificationType(itemForClassification);

  return {
    ...requiredItems,
    ...optionItems,
  } as RegisterFieldsItems;
}

/** Result of getAccountFormFields; group keys map to arrays of form field items (name is always set). */
interface AccountFormFieldsResult {
  contactInformation?: RegisterFieldsItems[];
  additionalInformation?: RegisterFieldsItems[];
  businessDetails?: RegisterFieldsItems[];
  address?: RegisterFieldsItems[];
  password?: RegisterFieldsItems[];
  [key: string]: RegisterFieldsItems[] | undefined;
}

function conversionItemFormat(FormFields: AccountFormFieldsList): AccountFormFieldsResult {
  const getFormFields: AccountFormFieldsResult = {};

  FormFields.forEach((item: CustomFieldItems) => {
    const key: string = groupItems[item.groupId as number] ?? String(item.groupId);

    const list = getFormFields[key] ?? [];
    if (list.length === 0) {
      getFormFields[key] = list;
    }

    let obj: CustomFieldItems = {};
    if (item.valueConfigs?.id) {
      obj = conversionSingleItem(item.valueConfigs) as CustomFieldItems;
    } else {
      obj = conversionSingleItem(item) as CustomFieldItems;
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
      obj.default = format(new Date(), DATE_INPUT_FORMAT);
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

    if (obj.label?.length > 0) {
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

    (getFormFields[key] as RegisterFieldsItems[]).push(obj as RegisterFieldsItems);
  });

  return getFormFields;
}

export function getAccountFormFields(
  accountFormFields: AccountFormFieldsList,
): AccountFormFieldsResult {
  if (accountFormFields?.length) {
    const filterVisibleAccountFormFields = (accountFormFields as AccountFormFieldsItems[]).filter(
      (item: Partial<AccountFormFieldsItems>) =>
        !!item.visible || (!!item.custom && !!item.isRequired),
    );

    const getAccountFormItems = filterVisibleAccountFormFields.length
      ? conversionItemFormat(filterVisibleAccountFormFields as AccountFormFieldsList)
      : {};

    return getAccountFormItems;
  }
  return {};
}
