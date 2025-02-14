import Cookies from 'js-cookie';

import { Fields, ParamProps } from '@/types/accountSetting';
import b2bLogger from '@/utils/b3Logger';
import { BigCommerceStorefrontAPIBaseURL } from '@/utils/basicConfig';

import { deCodeField } from '../Registered/config';

function sendUpdateAccountRequest(data: string): Promise<string> {
  const requestOptions: RequestInit = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: data,
    mode: 'cors',
    credentials: 'include',
  };

  return fetch(
    `${BigCommerceStorefrontAPIBaseURL}/account.php?action=update_account`,
    requestOptions,
  )
    .then((response) => {
      if (!response.ok) {
        throw new Error('Network response was not ok');
      }
      return response.text();
    })
    .then((responseData) => responseData);
}

const getXsrfToken = (): string | undefined => {
  const token = Cookies.get('XSRF-TOKEN');

  if (!token) {
    return undefined;
  }

  return decodeURIComponent(token);
};

// Password and email Change Send emails
function sendEmail(data: any, extraFields: any) {
  return new Promise<boolean>((resolve, reject) => {
    const { email, confirmPassword, newPassword, currentPassword } = data;

    const requiredCustomFields =
      extraFields.filter((item: CustomFieldItems) => item.required && item.custom) || [];
    const formData = new URLSearchParams();
    const token = getXsrfToken() || '';
    formData.append('FormField[1][1]', email);
    formData.append('FormField[1][24]', currentPassword);
    formData.append('FormField[1][2]', newPassword);
    formData.append('FormField[1][3]', confirmPassword);
    formData.append('authenticity_token', token);

    // extra
    if (requiredCustomFields.length) {
      requiredCustomFields.forEach((item: Partial<Fields>) => {
        if (item.name?.includes('_')) {
          const key = item.name?.split('_')[1];
          const { formFields } = data;
          const val = formFields.find(
            (field: Partial<Fields>) => field.name === item.bcLabel,
          ).value;
          if (item.type === 'date') {
            const time = val.split('-');
            if (!val && time.length !== 3) return;
            const [year, month, day] = time;
            formData.append(`FormFieldYear[1][${key}]`, year);
            formData.append(`FormFieldMonth[1][${key}]`, month);
            formData.append(`FormFieldDay[1][${key}]`, day);
          } else {
            formData.append(`FormField[1][${key}]`, val);
          }
        }
      });
    }

    const requestBody: string = formData.toString();

    sendUpdateAccountRequest(requestBody)
      .then((response) => {
        const isFlag = response.includes('alertBox--error');
        resolve(!isFlag);
      })
      .catch((error) => {
        b2bLogger.error('Error:', error);
        reject();
      });
  });
}

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

export default sendEmail;
