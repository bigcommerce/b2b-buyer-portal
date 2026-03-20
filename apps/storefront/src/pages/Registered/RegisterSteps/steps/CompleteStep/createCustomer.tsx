import { createBCCompanyUser } from '@/shared/service/b2b';
import { channelId, storeHash } from '@/utils/basicConfig';
import { deCodeField } from '@/utils/registerUtils';

import type { RegisterFields } from '../../../types';

interface CreateCustomerContext {
  emailMarketingNewsletter?: boolean;
  list?: RegisterFields[];
  additionalInfo?: RegisterFields[];
  accountType?: string;
  addressBasicList?: RegisterFields[];
  captchaKey: string;
}

export function createCustomer(
  data: CustomFieldItems,
  ctx: CreateCustomerContext,
): Promise<{ customerId: number; customerEmail: string }> {
  const {
    emailMarketingNewsletter,
    list,
    additionalInfo,
    accountType,
    addressBasicList = [],
    captchaKey,
  } = ctx;

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
    if (additionalInfo && (additionalInfo as Array<CustomFieldItems>).length) {
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

    if (getBCAddressField) {
      bcFields.addresses = {};
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

    // BC Extra field
    addresses.form_fields = [];
    if (getBCExtraAddressField && getBCExtraAddressField.length) {
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

  const userItem = {
    storeHash,
    ...bcFields,
  };

  return createBCCompanyUser(userItem, captchaKey).then((res) => ({
    customerId: res.customerCreate.customer.id,
    customerEmail: res.customerCreate.customer.email,
  }));
}
