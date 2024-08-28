export interface SimpleObject {
  [k: string]: string | number | undefined | null;
}

export interface Address {
  city: string;
  company: string;
  country: string;
  country_iso2: string;
  email: string;
  first_name: string;
  last_name: string;
  phone: string;
  state: string;
  street_1: string;
  street_2: string;
  zip: string;
}

export interface ProductPriceOption {
  optionId: number;
  valueId: number;
}

export interface ProductPriceItem {
  productId: number;
  variantId: number;
  options: Partial<ProductPriceOption>[];
}

export interface ProductPrice {
  storeHash: string;
  channel_id: number;
  currency_code: string;
  items: Partial<ProductPriceItem>[];
  customer_group_id: number;
}

interface FormField {
  name: string;
  value: string;
}

interface CreateCustomerAddress {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  phone: string;
  stateOrProvince: string;
  countryCode: string;
  postalCode: string;
  addressType: string;
  formFields: FormField[];
}

interface Attribute {
  attributeId: number;
  attributeValue: string;
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
  company?: string;
  phone?: string;
  notes?: string;
  tax_exempt_category?: string;
  customer_group_id?: number;
  addresses?: CreateCustomerAddress[] | [Record<string, never>];
  attributes?: Attribute[];
  authentication?: Authentication;
  accepts_product_review_abandoned_cart_emails?: boolean | undefined;
  store_credit_amounts?: StoreCreditAmount[];
  origin_channel_id?: number;
  channel_ids?: number[];
  form_fields?: FormField[];
  trigger_account_created_notification?: boolean;
  [key: string]: any;
}

export interface CustomerSubscribers {
  storeHash: string;
  email: string;
  first_name: string;
  last_name: string;
  channel_id: number;
  source?: string;
  order_id?: number;
}
