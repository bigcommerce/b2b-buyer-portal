import { UseFormSetError } from 'react-hook-form';
import isEmpty from 'lodash-es/isEmpty';

import { validateAddressExtraFields, validateBCCompanyExtraFields } from '@/shared/service/b2b';
import { Base64 } from '@/utils/base64';

import { ATTACHMENTS_FIELD_ID } from '../constants';
import type { AttachmentsValidationResult, RegisterFields } from '../types';

export function validateAttachmentsRequired(
  accountType: string,
  companyInformation: RegisterFields[],
  formData: Record<string, unknown>,
): AttachmentsValidationResult {
  if (accountType !== '1') return { hasError: false };

  const attachmentsField = companyInformation.find((info) => info.fieldId === ATTACHMENTS_FIELD_ID);
  if (isEmpty(attachmentsField) || !attachmentsField.required) {
    return { hasError: false };
  }

  const value = formData[attachmentsField.name];
  const isEmptyValue = Array.isArray(value) ? value.length === 0 : true;
  if (isEmptyValue) {
    return { hasError: true, field: attachmentsField };
  }

  return { hasError: false };
}

interface ValidateExtraFieldsProps {
  fields: RegisterFields[];
  data: CustomFieldItems;
  type: 'company' | 'address';
  setError: UseFormSetError<CustomFieldItems>;
}

export async function validateExtraFields({
  fields,
  data,
  type,
  setError,
}: ValidateExtraFieldsProps): Promise<void> {
  const customFields = fields.filter((item) => !!item.custom);

  const extraFields = customFields.map((field: RegisterFields) => ({
    fieldName: Base64.decode(field.name),
    fieldValue: data[field.name] || field.default,
  }));

  const fn = type === 'company' ? validateBCCompanyExtraFields : validateAddressExtraFields;
  const result = await fn({ extraFields });

  if (result.code !== 200) {
    const message = result.data?.errMsg || result.message || '';
    const messageArr = message.split(':');

    if (messageArr.length >= 2) {
      const field = customFields.find((f) => Base64.decode(f.name) === messageArr[0]);
      if (field) {
        setError(field.name, {
          type: 'manual',
          message: messageArr[1],
        });
      }
    }
    return Promise.reject(message);
  }
  return Promise.resolve();
}
