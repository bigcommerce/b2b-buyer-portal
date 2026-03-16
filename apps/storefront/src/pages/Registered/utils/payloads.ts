import { channelId, storeHash } from '@/utils/basicConfig';

import { EMAIL_MARKETING_FIELD_ID, FIRST_NAME_FIELD_ID, LAST_NAME_FIELD_ID } from '../constants';
import type {
  B2BCompanyPayloadInput,
  BCUserPayloadInput,
  SubscribersPayload,
  UploadB2BFileFn,
  UploadedFileListItem,
} from '../types';
import { RegisterFields } from '../types';

import { deCodeField, toHump } from './formFieldConversion';

export function buildBCUserPayload({
  list,
  additionalInfo,
  addressBasicList,
  accountType,
  data,
  emailMarketingNewsletter,
}: BCUserPayloadInput): CustomFieldItems {
  const bcFields: CustomFieldItems = {};

  bcFields.authentication = {
    force_password_reset: false,
    new_password: data.password ?? '',
  };

  bcFields.accepts_product_review_abandoned_cart_emails = Boolean(emailMarketingNewsletter);
  bcFields.addresses = [];
  bcFields.origin_channel_id = channelId;
  bcFields.channel_ids = [channelId];

  if (list) {
    list.forEach((item: CustomFieldItems) => {
      const name = deCodeField(item.name);
      if (name === 'accepts_marketing_emails') {
        bcFields.accepts_product_review_abandoned_cart_emails = !!item?.default?.length;
      } else if (!item.custom) {
        bcFields[name] = item?.default ?? '';
      }
    });

    bcFields.form_fields = [];
    if (additionalInfo?.length) {
      additionalInfo.forEach((field: CustomFieldItems) => {
        bcFields.form_fields.push({
          name: field.bcLabel,
          value: field.default,
        });
      });
    }
  }

  if (accountType === '2') {
    bcFields.trigger_account_created_notification = true;
  }

  if (accountType === '2' && addressBasicList?.length) {
    const addresses: CustomFieldItems = {};
    const basicFields = addressBasicList.filter((field: CustomFieldItems) => !field.custom);
    const extraFields = addressBasicList.filter((field: CustomFieldItems) => field.custom);

    if (basicFields.length) {
      basicFields.forEach((field: CustomFieldItems) => {
        const { name } = field;
        if (name === 'country') addresses.country_code = field.default;
        else if (name === 'state') addresses.state_or_province = field.default;
        else if (name === 'postalCode') addresses.postal_code = field.default;
        else if (name === 'firstName') addresses.first_name = field.default;
        else if (name === 'lastName') addresses.last_name = field.default;
        else (addresses as CustomFieldItems)[name] = field.default;
      });
    }

    addresses.form_fields = [];
    if (extraFields.length) {
      extraFields.forEach((field: CustomFieldItems) => {
        addresses.form_fields.push({
          name: field.bcLabel,
          value: field.default,
        });
      });
    }

    bcFields.addresses = [addresses];
  }

  return bcFields;
}

export function buildB2BCompanyPayload({
  contactList,
  companyInformation,
  addressBasicList,
  customerId,
  customerEmail,
  fileList,
}: B2BCompanyPayloadInput): CustomFieldItems {
  const b2bFields: CustomFieldItems = {
    customerId: customerId || '',
    customerEmail: customerEmail || '',
    storeHash,
    channelId,
    fileList,
  };

  const list = contactList ?? [];

  const companyUserExtraFieldsList = list.filter((item) => !!item.custom);
  if (companyUserExtraFieldsList.length) {
    b2bFields.userExtraFields = companyUserExtraFieldsList.map((item: CustomFieldItems) => ({
      fieldName: deCodeField(item.name),
      fieldValue: item?.default ?? '',
    }));
  }

  const companyInfo = companyInformation.filter(
    (item) => !item.custom && item.fieldType !== 'files',
  );
  const companyExtraInfo = companyInformation.filter((item) => !!item.custom);

  if (companyInfo.length) {
    companyInfo.forEach((item: CustomFieldItems) => {
      (b2bFields as CustomFieldItems)[toHump(deCodeField(item.name))] = item?.default ?? '';
    });
  }

  if (companyExtraInfo.length) {
    b2bFields.extraFields = companyExtraInfo.map((item: CustomFieldItems) => ({
      fieldName: deCodeField(item.name),
      fieldValue: item?.default ?? '',
    }));
  }

  const addressBasicInfo = addressBasicList.filter((item) => !item.custom);
  const addressExtraBasicInfo = addressBasicList.filter((item) => !!item.custom);

  if (addressBasicInfo.length) {
    addressBasicInfo.forEach((field: CustomFieldItems) => {
      const name = deCodeField(field.name);
      if (name === 'address1') b2bFields.addressLine1 = field.default;
      else if (name === 'address2') b2bFields.addressLine2 = field.default;
      (b2bFields as CustomFieldItems)[name] = field.default;
    });
  }

  if (addressExtraBasicInfo.length) {
    b2bFields.addressExtraFields = addressExtraBasicInfo.map((item: CustomFieldItems) => ({
      fieldName: deCodeField(item.name),
      fieldValue: item?.default ?? '',
    }));
  }

  return b2bFields;
}

export function getSubscribersPayload(
  list: RegisterFields[] | undefined,
  enterEmail: string,
): SubscribersPayload | null {
  if (!list?.length) return null;

  const emailMarketingField = list.find(
    (item: CustomFieldItems) =>
      item.fieldId === EMAIL_MARKETING_FIELD_ID && item.fieldType === 'checkbox',
  );
  const firstNameField = list.find((item: RegisterFields) => item.fieldId === FIRST_NAME_FIELD_ID);
  const lastNameField = list.find((item: RegisterFields) => item.fieldId === LAST_NAME_FIELD_ID);

  const isChecked = emailMarketingField?.isChecked ?? false;
  const defaultValue = emailMarketingField?.default ?? [];

  if (!isChecked || !Array.isArray(defaultValue) || defaultValue.length === 0) {
    return null;
  }

  return {
    storeHash,
    email: enterEmail,
    first_name: (firstNameField as CustomFieldItems)?.default ?? '',
    last_name: (lastNameField as CustomFieldItems)?.default ?? '',
    channel_id: channelId || 1,
  };
}

export async function uploadAttachmentsToFileList(
  attachmentsList: RegisterFields[],
  uploadB2BFile: UploadB2BFileFn,
  getUploadErrorLabel: () => string,
): Promise<UploadedFileListItem[] | undefined> {
  if (!attachmentsList?.length) return undefined;

  const attachments: File[] =
    (attachmentsList.find((f) => Array.isArray(f.default) && (f.default as File[]).length)
      ?.default as File[]) ?? [];
  if (!attachments.length) return undefined;

  const fileResponse = await Promise.all(
    attachments.map((file: File) =>
      uploadB2BFile({
        file,
        type: 'companyAttachedFile',
      }),
    ),
  );

  return fileResponse.reduce<UploadedFileListItem[]>((fileList, res) => {
    if (res.code === 200 && res.data) {
      const newData = { ...res.data };
      newData.fileSize = newData.fileSize ? newData.fileSize : '';
      return [...fileList, newData];
    }
    const errMsg = res.data?.errMsg ?? res.message ?? getUploadErrorLabel();
    throw new Error(errMsg);
  }, []);
}
