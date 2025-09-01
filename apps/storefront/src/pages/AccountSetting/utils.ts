import { Fields, ParamProps } from '@/types/accountSetting';
import { validatorRules } from '@/utils';

import { deCodeField } from '../Registered/config';

const emailValidate = validatorRules(['email']);

export const initB2BInfo = (
  accountSettings: any,
  contactInformation: Partial<Fields>[],
  accountB2BFormFields: Partial<Fields>[],
  additionalInformation: Partial<Fields>[],
) => {
  const extraFields = accountSettings?.extraFields || [];
  contactInformation.forEach((item: Partial<Fields>) => {
    const contactItem = item;
    if (deCodeField(item?.name || '') === 'first_name') {
      contactItem.default = accountSettings.firstName;
    }
    if (deCodeField(item?.name || '') === 'last_name') {
      contactItem.default = accountSettings.lastName;
    }
    if (deCodeField(item?.name || '') === 'phone') {
      contactItem.default = accountSettings.phoneNumber;
    }
    if (deCodeField(item?.name || '') === 'email') {
      contactItem.default = accountSettings.email;
      contactItem.validate = emailValidate;
    }
  });

  if (extraFields.length > 0) {
    extraFields.forEach((field: CustomFieldItems) => {
      const extraField = field;

      const currentField = contactInformation.find(
        (item) => deCodeField(item?.name || '') === extraField.fieldName,
      );

      if (currentField) {
        currentField.default = extraField.fieldValue;
      }
    });
  }

  accountB2BFormFields.forEach((item: Partial<Fields>) => {
    const formField = item;
    if (item.name === 'role') {
      formField.default = accountSettings.companyRoleName;
      formField.disabled = true;
    } else if (item.name === 'company') {
      formField.default = accountSettings.company;
      formField.disabled = true;
    }
  });

  additionalInformation.forEach((item: Partial<Fields>) => {
    const formFields = (accountSettings?.formFields || []).find(
      (field: Partial<Fields>) => field.name === item.bcLabel,
    );
    const infoItem = item;
    if (formFields) infoItem.default = formFields.value;
  });

  return [...contactInformation, ...accountB2BFormFields, ...additionalInformation];
};

export const initBcInfo = (
  accountSettings: any,
  contactInformation: Partial<Fields>[],
  additionalInformation: Partial<Fields>[],
) => {
  contactInformation.forEach((item: Partial<Fields>) => {
    const contactInfoItem = item;
    if (deCodeField(item?.name || '') === 'first_name') {
      contactInfoItem.default = accountSettings.firstName;
    }
    if (deCodeField(item?.name || '') === 'last_name') {
      contactInfoItem.default = accountSettings.lastName;
    }
    if (deCodeField(item?.name || '') === 'phone') {
      contactInfoItem.default = accountSettings.phoneNumber;
    }
    if (deCodeField(item?.name || '') === 'email') {
      contactInfoItem.default = accountSettings.email;
      contactInfoItem.validate = emailValidate;
    }
    if (deCodeField(item?.name || '') === 'company') {
      contactInfoItem.default = accountSettings.company;
    }
  });

  additionalInformation.forEach((item: Partial<Fields>) => {
    const formFields = (accountSettings?.formFields || []).find(
      (field: Partial<Fields>) => field.name === item.bcLabel,
    );
    const infoItem = item;
    if (formFields) infoItem.default = formFields.value;
  });

  return [...contactInformation, ...additionalInformation];
};

export const b2bSubmitDataProcessing = (
  data: CustomFieldItems,
  accountSettings: any,
  decryptionFields: Partial<Fields>[],
  extraFields: Partial<Fields>[],
) => {
  const userExtraFields = accountSettings?.extraFields || [];

  const param: Partial<ParamProps> = {};
  param.formFields = [];
  let pristine = true;
  let flag = true;
  let useExtraFieldsFlag = false;

  Object.keys(data).forEach((key: string) => {
    decryptionFields.forEach((item: Partial<Fields>) => {
      if (key === item.name) {
        flag = false;
        if (deCodeField(item.name) === 'first_name') {
          if (accountSettings.firstName !== data[item.name]) pristine = false;
          param.firstName = data[item.name];
        }
        if (deCodeField(item.name) === 'last_name') {
          if (accountSettings.lastName !== data[item.name]) pristine = false;
          param.lastName = data[item.name];
        }
        if (deCodeField(item.name) === 'phone') {
          if (accountSettings.phoneNumber !== data[item.name]) pristine = false;
          param.phoneNumber = data[item.name];
        }
        if (deCodeField(item.name) === 'email') {
          if (accountSettings.email !== data[item.name]) pristine = false;
          param.email = data[item.name];
        }
        if (item.custom) {
          const currentField = userExtraFields.find(
            (field: CustomFieldItems) => field.fieldName === deCodeField(item?.name || ''),
          );
          if (currentField?.fieldValue !== data[item.name]) useExtraFieldsFlag = true;
        }
      }
    });
    if (useExtraFieldsFlag) {
      pristine = false;
    }

    if (flag) {
      extraFields.forEach((field: Partial<Fields>) => {
        if (field.fieldId === key && param?.formFields) {
          const { name } = field;
          param.formFields.push({
            name: field?.bcLabel || '',
            value: data[key],
          });
          flag = false;
          const account = (accountSettings?.formFields || []).find(
            (formField: Partial<Fields>) => formField.name === field.bcLabel,
          );
          if (account && JSON.stringify(account.value) !== JSON.stringify(data[key])) {
            pristine = false;
          }

          if (!accountSettings?.formFields?.length && name && !!data[name]) {
            pristine = false;
          }
        }
      });
    }
    if (flag) {
      if (key === 'password') {
        param.newPassword = data[key];
        if (data[key]) pristine = false;
      } else {
        param[key] = data[key];
      }
    }
    flag = true;
  });

  delete param.company;

  delete param.role;

  if (pristine) {
    return undefined;
  }

  return param;
};

export const bcSubmitDataProcessing = (
  data: CustomFieldItems,
  accountSettings: any,
  decryptionFields: Partial<Fields>[],
  extraFields: Partial<Fields>[],
) => {
  const param: Partial<ParamProps> = {};
  param.formFields = [];
  let pristine = true;
  let flag = true;
  Object.keys(data).forEach((key: string) => {
    decryptionFields.forEach((item: Partial<Fields>) => {
      if (key === item.name) {
        flag = false;
        if (deCodeField(item.name) === 'first_name') {
          if (accountSettings.firstName !== data[item.name]) pristine = false;
          param.firstName = data[item.name];
        }
        if (deCodeField(item.name) === 'last_name') {
          if (accountSettings.lastName !== data[item.name]) pristine = false;
          param.lastName = data[item.name];
        }
        if (deCodeField(item.name) === 'phone') {
          if (accountSettings.phoneNumber !== data[item.name]) pristine = false;
          param.phoneNumber = data[item.name];
        }
        if (deCodeField(item.name) === 'email') {
          if (accountSettings.email !== data[item.name]) pristine = false;
          param.email = data[item.name];
        }
        if (deCodeField(item.name) === 'company') {
          if (accountSettings.company !== data[item.name]) pristine = false;
          param.company = data[item.name];
        }
      }
    });

    if (flag) {
      extraFields.forEach((field: Partial<Fields>) => {
        if (field.fieldId === key && param?.formFields) {
          param.formFields.push({
            name: field?.bcLabel || '',
            value: data[key],
          });
          flag = false;
          const account = (accountSettings?.formFields || []).find(
            (formField: Partial<Fields>) => formField.name === field.bcLabel,
          );
          if (account && JSON.stringify(account.value) !== JSON.stringify(data[key]))
            pristine = false;
        }
      });
    }

    if (flag) {
      if (key === 'password') {
        param.newPassword = data[key];
        if (data[key]) pristine = false;
      } else {
        param[key] = data[key];
      }
    }
    flag = true;
  });

  if (pristine) {
    return undefined;
  }

  return param;
};
