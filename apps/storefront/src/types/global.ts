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
