import { storeHash } from '@/utils';

import B3Request from '../../request/b3Fetch';
import { RequestType } from '../../request/base';

interface FormField {
  name: string;
  value: string;
}

interface Address {
  address1: string;
  address2: string;
  address_type: string;
  city: string;
  company: string;
  country_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  postal_code: string;
  state_or_province: string;
  form_fields: FormField[];
}

interface Authentication {
  force_password_reset: boolean;
  new_password: string;
}

interface StoreCreditAmount {
  amount: number;
}

export interface CreateCustomer {
  storeHash: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  phone: string;
  notes: string;
  tax_exempt_category: string;
  customer_group_id: number;
  addresses: Address[];
  authentication: Authentication;
  accepts_product_review_abandoned_cart_emails: boolean;
  store_credit_amounts: StoreCreditAmount[];
  origin_channel_id: number;
  channel_ids: number[];
  form_fields: FormField[];
}

interface CustomerSubscribers {
  storeHash: string;
  email: string;
  first_name: string;
  last_name: string;
  source: string;
  order_id: number;
  channel_id: number;
}

export const createBCCompanyUser = (data: Partial<CreateCustomer>) =>
  B3Request.post('/api/v2/bc/customers', RequestType.B2BRest, data);

export const sendSubscribersState = (data: Partial<CustomerSubscribers>) =>
  B3Request.post('/api/v2/bc/customers/subscribers', RequestType.B2BRest, data);

export const validateBCCompanyExtraFields = (data: CustomFieldItems) =>
  B3Request.post('/api/v2/extra-fields/company/validate', RequestType.B2BRest, {
    ...data,
    storeHash,
  });

export const validateBCCompanyUserExtraFields = (data: CustomFieldItems) =>
  B3Request.post('/api/v2/extra-fields/user/validate', RequestType.B2BRest, {
    ...data,
    storeHash,
  });
