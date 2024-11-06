import { ExtraFieldsConfigType, Maybe, QuoteExtraFieldsConfigType } from '@/types/gql/graphql';

import { Product } from './products';

export interface ContactInfo {
  name: string;
  email: string;
  companyName: string;
  phoneNumber: string;
  quoteTitle?: string;
}

export interface BillingAddress {
  address: string;
  addressId: number;
  apartment: string;
  city: string;
  companyName: string;
  country: string;
  firstName: string;
  label: string;
  lastName: string;
  phoneNumber: string;
  state: string;
  zipCode: string;
}

export interface ShippingAddress {
  address: string;
  addressId: number;
  apartment: string;
  city: string;
  companyName: string;
  country: string;
  firstName: string;
  label: string;
  lastName: string;
  phoneNumber: string;
  state: string;
  zipCode: string;
}

export interface FileInfo {
  id?: string;
  fileName: string;
  fileType: string;
  fileUrl: string;
  fileSize?: number;
  title?: string;
  hasDelete?: boolean;
  isCustomer?: boolean;
}

export interface AdditionalCalculatedPricesProps {
  additionalCalculatedPrice: number;
  additionalCalculatedPriceTax: number;
}

export type CalculatedValue = Record<
  string,
  string | number | Array<string | number> | Record<string, string | number>
>;

export type ContactInfoKeys = keyof ContactInfo;

export interface BcCalculatedPrice {
  as_entered: number;
  entered_inclusive: boolean;
  tax_exclusive: number;
  tax_inclusive: number;
}

export interface QuoteItem {
  node: {
    basePrice: number;
    id: string;
    optionList: string;
    primaryImage?: string;
    productId?: number;
    productName?: string;
    quantity: number;
    taxPrice: number;
    variantId?: number;
    variantSku?: string;
    calculatedValue: CalculatedValue;
    productsSearch: Product;
    additionalCalculatedPrices?:
      | AdditionalCalculatedPricesProps
      | AdditionalCalculatedPricesProps[];
  };
}

export interface QuoteExtraFields {
  id?: number;
  fieldName: Maybe<string> | undefined;
  value: string | number;
}

export interface QuoteInfo {
  userId?: number;
  contactInfo: ContactInfo;
  shippingAddress: ShippingAddress;
  billingAddress: BillingAddress;
  fileInfo?: FileInfo[];
  note?: string;
  referenceNumber?: string;
  extraFields?: QuoteExtraFields[];
}

export interface QuoteInfoAndExtrafieldsItemProps {
  info: {
    quoteTitle: string;
    referenceNumber: string;
  };
  extraFields: QuoteExtraFields[] | undefined;
  recipients: string[];
}

export interface B2bExtraFieldsProps {
  defaultValue: string;
  fieldName: string;
  fieldType: 0 | 1 | 2 | 3;
  isRequired: boolean;
  labelName: string;
  listOfValue: null | Array<string>;
  maximumLength: string | number | null;
  maximumValue: string | number | null;
  numberOfRows: string | number | null;
  visibleToEnduser: boolean;
  id: number | string;
}

export interface FieldsOptionProps {
  label: Maybe<string>;
  value: Maybe<string>;
}

export interface QuoteFormattedItemsProps {
  isExtraFields: boolean;
  name: Maybe<string> | undefined;
  label: Maybe<string> | undefined;
  required?: boolean | null;
  default: string | number;
  fieldType: string;
  xs: number;
  variant: string;
  size: string;
  options?: FieldsOptionProps[];
  max?: string | number | null;
  rows?: string | number | null;
  maxLength?: string | number | null;
  id: number | string;
}

export type QuoteExtraFieldsOrigin = Omit<ExtraFieldsConfigType, 'fieldType'> &
  QuoteExtraFieldsConfigType & {
    fieldCategory: string;
  };

export interface QuoteExtraFieldsType {
  quoteExtraFieldsConfig: QuoteExtraFieldsOrigin[];
}

export interface QuoteExtraFieldsData {
  fieldName: string | undefined;
  fieldValue: string | number;
}
