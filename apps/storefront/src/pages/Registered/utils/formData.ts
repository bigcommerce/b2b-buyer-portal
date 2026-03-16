import { EMAIL_FIELD_ID, EMAIL_MARKETING_FIELD_ID } from '../constants';
import { RegisterFields } from '../types';

export function applyContactEmailTip(
  contactInformation: RegisterFields[] | undefined,
  accountType: string,
  tipText: string,
): RegisterFields[] {
  if (!contactInformation?.length) return contactInformation ?? [];
  if (accountType !== '1') return contactInformation;

  return contactInformation.map((item) => {
    if (item.fieldId === EMAIL_FIELD_ID) {
      return {
        ...item,
        isTip: true,
        tipText,
      };
    }
    return item;
  });
}

export function getEmailFieldName(contactInformation: RegisterFields[] | undefined): string {
  const emailField = contactInformation?.find((item) => item.fieldId === EMAIL_FIELD_ID);
  return emailField?.name ?? 'email';
}

export function mergeContactInfoWithFormData(
  contactInfo: RegisterFields[],
  formData: Record<string, unknown>,
): RegisterFields[] {
  return contactInfo.map((item) => {
    const defaultVal = formData[item.name] || item.default;
    const isEmailMarketing =
      item.fieldId === EMAIL_MARKETING_FIELD_ID && item.fieldType === 'checkbox';
    return {
      ...item,
      default: defaultVal,
      ...(isEmailMarketing && {
        isChecked: Array.isArray(defaultVal) ? defaultVal.length > 0 : Boolean(defaultVal),
      }),
    };
  });
}

export function setRegisterFieldsFromFormData(
  formFields: RegisterFields[],
  formData: Record<string, unknown>,
): RegisterFields[] {
  return formFields.map((field) => ({
    ...field,
    default: formData[field.name] || field.default,
  }));
}

export function buildDetailsFormValues(
  fields: RegisterFields[],
  getValue: (name: string) => unknown,
): Record<string, unknown> {
  return fields.reduce<Record<string, unknown>>((acc, field) => {
    acc[field.name] = getValue(field.name) || field.default;
    return acc;
  }, {});
}
