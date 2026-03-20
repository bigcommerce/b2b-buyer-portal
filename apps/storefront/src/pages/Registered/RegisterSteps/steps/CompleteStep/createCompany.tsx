import { createB2BCompanyUser } from '@/shared/service/b2b';
import b2bLogger from '@/utils/b3Logger';
import { channelId, storeHash } from '@/utils/basicConfig';
import { deCodeField, toHump } from '@/utils/registerUtils';

import type { RegisterFields } from '../../../types';

interface CreateCompanyContext {
  list?: RegisterFields[];
  companyInformation: RegisterFields[];
  addressBasicList: RegisterFields[];
}

export async function createCompany(
  _data: CustomFieldItems,
  customerId: number | string,
  customerEmail: string,
  fileList: unknown,
  ctx: CreateCompanyContext,
) {
  const { list, companyInformation, addressBasicList } = ctx;

  try {
    const b2bFields: CustomFieldItems = {};
    b2bFields.customerId = customerId || '';
    b2bFields.customerEmail = customerEmail || '';
    b2bFields.storeHash = storeHash;

    // company user extra field
    const b2bContactInformationList = list || [];
    const companyUserExtraFieldsList = b2bContactInformationList.filter((item) => !!item.custom);

    if (companyUserExtraFieldsList.length) {
      const companyUserExtraFields: Array<CustomFieldItems> = [];
      companyUserExtraFieldsList.forEach((item: CustomFieldItems) => {
        const itemExtraField: CustomFieldItems = {};
        itemExtraField.fieldName = deCodeField(item.name);
        itemExtraField.fieldValue = item?.default || '';
        companyUserExtraFields.push(itemExtraField);
      });
      b2bFields.userExtraFields = companyUserExtraFields;
    }

    const companyInfo = companyInformation.filter(
      (listItem) => !listItem.custom && listItem.fieldType !== 'files',
    );
    const companyExtraInfo = companyInformation.filter((listItem) => !!listItem.custom);
    // company field
    if (companyInfo.length) {
      companyInfo.forEach((item: RegisterFields) => {
        b2bFields[toHump(deCodeField(item.name))] = item?.default || '';
      });
    }

    // Company Additional Field
    if (companyExtraInfo.length) {
      const extraFields: Array<CustomFieldItems> = [];
      companyExtraInfo.forEach((item: CustomFieldItems) => {
        const itemExtraField: CustomFieldItems = {};
        itemExtraField.fieldName = deCodeField(item.name);
        itemExtraField.fieldValue = item?.default || '';
        extraFields.push(itemExtraField);
      });
      b2bFields.extraFields = extraFields;
    }

    // address Field
    const addressBasicInfo = addressBasicList.filter((listItem) => !listItem.custom) || [];
    const addressExtraBasicInfo = addressBasicList.filter((listItem) => !!listItem.custom) || [];

    if (addressBasicInfo.length) {
      addressBasicInfo.forEach((field: CustomFieldItems) => {
        const name = deCodeField(field.name);
        if (name === 'address1') {
          b2bFields.addressLine1 = field.default;
        }
        if (name === 'address2') {
          b2bFields.addressLine2 = field.default;
        }
        b2bFields[name] = field.default;
      });
    }

    // address Additional Field
    if (addressExtraBasicInfo.length) {
      const extraFields: Array<CustomFieldItems> = [];
      addressExtraBasicInfo.forEach((item: CustomFieldItems) => {
        const itemExtraField: CustomFieldItems = {};
        itemExtraField.fieldName = deCodeField(item.name);
        itemExtraField.fieldValue = item?.default || '';
        extraFields.push(itemExtraField);
      });
      b2bFields.addressExtraFields = extraFields;
    }
    b2bFields.fileList = fileList;
    b2bFields.channelId = channelId;

    return await createB2BCompanyUser(b2bFields);
  } catch (error) {
    b2bLogger.error(error);
  }
  return undefined;
}
