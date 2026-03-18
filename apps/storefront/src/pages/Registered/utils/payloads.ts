import { deCodeField, toHump } from '@/utils/registerUtils';

import type { RegisterFields } from '../types';

interface BuildBCUserPayloadParams {
  data: CustomFieldItems;
  list: RegisterFields[] | undefined;
  additionalInfo: RegisterFields[] | undefined;
  addressBasicList: RegisterFields[];
  accountType: string | undefined;
  emailMarketingNewsletter: boolean | undefined;
  channelId: number | string;
  storeHash: string;
}

export function buildBCUserPayload({
  data,
  list,
  additionalInfo,
  addressBasicList,
  accountType,
  emailMarketingNewsletter,
  channelId,
  storeHash,
}: BuildBCUserPayloadParams): CustomFieldItems {
  const bcFields: CustomFieldItems = {};

  bcFields.authentication = {
    force_password_reset: false,
    new_password: data.password,
  };

  bcFields.accepts_product_review_abandoned_cart_emails = emailMarketingNewsletter;

  if (list) {
    list.forEach((item: RegisterFields) => {
      const name = deCodeField(item.name);
      if (name === 'accepts_marketing_emails') {
        bcFields.accepts_product_review_abandoned_cart_emails = Array.isArray(item?.default)
          ? !!item.default.length
          : false;
      } else if (!item.custom) {
        bcFields[name] = item?.default || '';
      }
    });

    bcFields.form_fields = [];
    if (additionalInfo && additionalInfo.length) {
      additionalInfo.forEach((field: CustomFieldItems) => {
        bcFields.form_fields.push({
          name: field.bcLabel,
          value: field.default,
        });
      });
    }
  }

  bcFields.addresses = [];
  bcFields.origin_channel_id = channelId;
  bcFields.channel_ids = [channelId];

  if (accountType === '2') {
    const addresses: CustomFieldItems = {};

    const getBCAddressField = addressBasicList.filter((field: RegisterFields) => !field.custom);
    const getBCExtraAddressField = addressBasicList.filter((field: RegisterFields) => field.custom);

    if (getBCAddressField.length) {
      getBCAddressField.forEach((field: RegisterFields) => {
        if (field.name === 'country') {
          addresses.country_code = field.default;
        } else if (field.name === 'state') {
          addresses.state_or_province = field.default;
        } else if (field.name === 'postalCode') {
          addresses.postal_code = field.default;
        } else if (field.name === 'firstName') {
          addresses.first_name = field.default;
        } else if (field.name === 'lastName') {
          addresses.last_name = field.default;
        } else {
          addresses[field.name] = field.default;
        }
      });
    }

    addresses.form_fields = [];
    if (getBCExtraAddressField.length) {
      getBCExtraAddressField.forEach((field: RegisterFields) => {
        addresses.form_fields.push({
          name: field.bcLabel,
          value: field.default,
        });
      });
    }

    bcFields.addresses = [addresses];
    bcFields.trigger_account_created_notification = true;
  }

  return {
    storeHash,
    ...bcFields,
  };
}

interface BuildB2BCompanyPayloadParams {
  contactList: RegisterFields[];
  companyInformation: RegisterFields[];
  addressBasicList: RegisterFields[];
  customerId: number | string;
  customerEmail: string;
  fileList: unknown;
  storeHash: string;
  channelId: number | string;
}

export function buildB2BCompanyPayload({
  contactList,
  companyInformation,
  addressBasicList,
  customerId,
  customerEmail,
  fileList,
  storeHash,
  channelId,
}: BuildB2BCompanyPayloadParams): CustomFieldItems {
  const b2bFields: CustomFieldItems = {};
  b2bFields.customerId = customerId || '';
  b2bFields.customerEmail = customerEmail || '';
  b2bFields.storeHash = storeHash;

  const companyUserExtraFieldsList = contactList.filter((item) => !!item.custom);

  if (companyUserExtraFieldsList.length) {
    const companyUserExtraFields: Array<CustomFieldItems> = [];
    companyUserExtraFieldsList.forEach((item: CustomFieldItems) => {
      companyUserExtraFields.push({
        fieldName: deCodeField(item.name),
        fieldValue: item?.default || '',
      });
    });
    b2bFields.userExtraFields = companyUserExtraFields;
  }

  const companyInfo = companyInformation.filter(
    (item) => !item.custom && item.fieldType !== 'files',
  );
  const companyExtraInfo = companyInformation.filter((item) => !!item.custom);

  if (companyInfo.length) {
    companyInfo.forEach((item: RegisterFields) => {
      b2bFields[toHump(deCodeField(item.name))] = item?.default || '';
    });
  }

  if (companyExtraInfo.length) {
    const extraFields: Array<CustomFieldItems> = [];
    companyExtraInfo.forEach((item: CustomFieldItems) => {
      extraFields.push({
        fieldName: deCodeField(item.name),
        fieldValue: item?.default || '',
      });
    });
    b2bFields.extraFields = extraFields;
  }

  const addressBasicInfo = addressBasicList.filter((item) => !item.custom);
  const addressExtraBasicInfo = addressBasicList.filter((item) => !!item.custom);

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

  if (addressExtraBasicInfo.length) {
    const extraFields: Array<CustomFieldItems> = [];
    addressExtraBasicInfo.forEach((item: CustomFieldItems) => {
      extraFields.push({
        fieldName: deCodeField(item.name),
        fieldValue: item?.default || '',
      });
    });
    b2bFields.addressExtraFields = extraFields;
  }

  b2bFields.fileList = fileList;
  b2bFields.channelId = channelId;

  return b2bFields;
}

type UploadB2BFileFn = (params: { file: File; type: string }) => Promise<{
  code: number;
  data?: { errMsg?: string; fileSize?: string };
  message?: string;
}>;

export async function uploadAttachmentsToFileList(
  attachmentsList: RegisterFields[],
  uploadB2BFile: UploadB2BFileFn,
  getUploadFailureMessage: () => string,
): Promise<Array<Record<string, unknown>> | undefined> {
  let attachments: File[] = [];

  if (!attachmentsList.length) return undefined;

  attachmentsList.forEach((field: RegisterFields) => {
    attachments = (field.default as File[]) ?? [];
  });

  const fileResponse = await Promise.all(
    attachments.map((file: File) =>
      uploadB2BFile({
        file,
        type: 'companyAttachedFile',
      }),
    ),
  );

  const fileList = fileResponse.reduce(
    (
      accumulatedFileList: Array<Record<string, unknown>>,
      res: { code: number; data?: { errMsg?: string; fileSize?: string }; message?: string },
    ) => {
      if (res.code === 200) {
        const newData = {
          ...res.data,
        } as Record<string, unknown>;
        newData.fileSize = newData.fileSize ? `${newData.fileSize}` : '';
        return [...accumulatedFileList, newData];
      }
      const message = res.data?.errMsg || res.message || getUploadFailureMessage();
      throw new Error(message);
    },
    [],
  );

  return fileList;
}
