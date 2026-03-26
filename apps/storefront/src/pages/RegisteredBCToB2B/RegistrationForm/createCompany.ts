import type { RegisterFields } from '@/pages/Registered/types';
import { channelId, storeHash } from '@/utils/basicConfig';
import { deCodeField, toHump } from '@/utils/registerUtils';

/**
 * B2B `companyCreate` payload for BC→B2B registration (`createB2BCompanyUser`).
 * Co-located with `RegistrationForm` like `RegisterSteps/steps/CompleteStep/createCompany`.
 */

export function getRegisterFieldValueForBcToB2bForm(
  field: RegisterFields,
  data: CustomFieldItems,
): string {
  const fromForm = data[field.name];
  const resolved = fromForm ?? field.default;
  if (resolved === undefined || resolved === null) return '';
  if (Array.isArray(resolved)) return resolved.length ? String(resolved[0]) : '';
  return String(resolved);
}

export function buildCompanyUserExtraFieldsForBcToB2b(
  contactList: RegisterFields[],
  getValue: (field: RegisterFields) => string,
): CustomFieldItems[] {
  return contactList
    .filter((item) => !!item.custom)
    .map((item) => ({
      fieldName: deCodeField(item.name),
      fieldValue: getValue(item),
    }));
}

export function buildB2bCompanyCreatePayloadForBcToB2b(input: {
  customerId: number | string;
  customerEmail: string;
  fileList: unknown;
  companyInformation: RegisterFields[];
  addressBasicList: RegisterFields[];
  contactInformationList: RegisterFields[];
  getValue: (field: RegisterFields) => string;
}): CustomFieldItems {
  const {
    customerId,
    customerEmail,
    fileList,
    companyInformation,
    addressBasicList,
    contactInformationList,
    getValue,
  } = input;

  const b2bFields: CustomFieldItems = {};
  b2bFields.customerId = customerId || '';
  b2bFields.customerEmail = customerEmail || '';
  b2bFields.storeHash = storeHash;

  const userExtraFields = buildCompanyUserExtraFieldsForBcToB2b(contactInformationList, getValue);
  if (userExtraFields.length) {
    b2bFields.userExtraFields = userExtraFields;
  }

  const companyInfo = companyInformation.filter(
    (listItem) => !listItem.custom && listItem.fieldType !== 'files',
  );
  const companyExtraInfo = companyInformation.filter((listItem) => !!listItem.custom);

  companyInfo.forEach((item) => {
    b2bFields[toHump(deCodeField(item.name))] = getValue(item);
  });

  if (companyExtraInfo.length) {
    b2bFields.extraFields = companyExtraInfo.map((item) => ({
      fieldName: deCodeField(item.name),
      fieldValue: getValue(item),
    }));
  }

  const addressBasicInfo = addressBasicList.filter((listItem) => !listItem.custom);
  const addressExtraBasicInfo = addressBasicList.filter((listItem) => !!listItem.custom);

  addressBasicInfo.forEach((field) => {
    const name = deCodeField(field.name);
    const value = getValue(field);
    if (name === 'address1') {
      b2bFields.addressLine1 = value;
    }
    if (name === 'address2') {
      b2bFields.addressLine2 = value;
    }
    b2bFields[name] = value;
  });

  if (addressExtraBasicInfo.length) {
    b2bFields.addressExtraFields = addressExtraBasicInfo.map((item) => ({
      fieldName: deCodeField(item.name),
      fieldValue: getValue(item),
    }));
  }

  b2bFields.fileList = fileList;
  b2bFields.channelId = channelId;

  return b2bFields;
}
