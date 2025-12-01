/* eslint-disable */
export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = {
  [_ in K]?: never;
};
export type Incremental<T> =
  | T
  | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string };
  String: { input: string; output: string };
  Boolean: { input: boolean; output: boolean };
  Int: { input: number; output: number };
  Float: { input: number; output: number };
  CurrencyDecimalPlaces: { input: any; output: any };
  /**
   * The `Date` scalar type represents a Date
   * value as specified by
   * [iso8601](https://en.wikipedia.org/wiki/ISO_8601).
   */
  Date: { input: any; output: any };
  /** The `Decimal` scalar type represents a python Decimal. */
  Decimal: { input: any; output: any };
  /**
   * The `GenericScalar` scalar type represents a generic
   * GraphQL scalar value that could be:
   * String, Boolean, Int, Float, List or Object.
   */
  GenericScalar: { input: any; output: any };
  /**
   * Allows use of a JSON String for input / output from the GraphQL schema.
   *
   * Use of this type is *not recommended* as you lose the benefits of having a defined, static
   * schema (one of the key benefits of GraphQL).
   */
  JSONString: { input: any; output: any };
  ProductQuantity: { input: any; output: any };
};

export type AccountFormFieldsType = Node & {
  __typename?: 'AccountFormFieldsType';
  /** The created at of this field */
  createdAt?: Maybe<Scalars['Int']['output']>;
  /** Is this field custom */
  custom?: Maybe<Scalars['Boolean']['output']>;
  /** The field from of this field */
  fieldFrom?: Maybe<Scalars['Int']['output']>;
  /** The field ID of this field */
  fieldId?: Maybe<Scalars['String']['output']>;
  /** The field index of this field */
  fieldIndex?: Maybe<Scalars['Int']['output']>;
  /** The field name of this field */
  fieldName?: Maybe<Scalars['String']['output']>;
  /** The field type of this field */
  fieldType?: Maybe<Scalars['String']['output']>;
  /** The form type of this field */
  formType?: Maybe<Scalars['Int']['output']>;
  /** The group ID of this field */
  groupId?: Maybe<Scalars['Int']['output']>;
  /** The group name of this field */
  groupName?: Maybe<Scalars['String']['output']>;
  /** Unique ID of this company */
  id: Scalars['ID']['output'];
  /** Is this field required */
  isRequired?: Maybe<Scalars['Boolean']['output']>;
  /** The label name of this field */
  labelName?: Maybe<Scalars['String']['output']>;
  /** The updated at of this field */
  updatedAt?: Maybe<Scalars['Int']['output']>;
  /** The value configs of this field */
  valueConfigs?: Maybe<Scalars['GenericScalar']['output']>;
  /** Is this field visible */
  visible?: Maybe<Scalars['Boolean']['output']>;
};

export type AccountSettingType = {
  __typename?: 'AccountSettingType';
  /** Company for user */
  company?: Maybe<Scalars['String']['output']>;
  /** Company user role id */
  companyRoleId?: Maybe<Scalars['Int']['output']>;
  /** Company user role name */
  companyRoleName?: Maybe<Scalars['String']['output']>;
  /** User email */
  email?: Maybe<Scalars['String']['output']>;
  /** extra fields of this user */
  extraFields?: Maybe<Array<Maybe<UserExtraFieldsValueType>>>;
  /** User first name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** List of address form fields */
  formFields?: Maybe<Array<Maybe<FormFieldsType>>>;
  /** User last name */
  lastName?: Maybe<Scalars['String']['output']>;
  /** User phone number */
  phoneNumber?: Maybe<Scalars['String']['output']>;
  /** User role. Required. 0 - Admin, 1 - Senior Buyer, 2 - Junior Buyer */
  role?: Maybe<Scalars['Int']['output']>;
};

/**
 * Create a company address.
 * Requires a B2B Token.
 */
export type AddressCreate = {
  __typename?: 'AddressCreate';
  address?: Maybe<AddressType>;
};

/**
 * Delete a company address.
 * Requires a B2B Token.
 */
export type AddressDelete = {
  __typename?: 'AddressDelete';
  message?: Maybe<Scalars['String']['output']>;
};

export type AddressExtraFieldInputType = {
  /** The extra field name. Required */
  fieldName: Scalars['String']['input'];
  /** The extra field value. Required */
  fieldValue: Scalars['String']['input'];
};

export type AddressExtraFieldType = {
  __typename?: 'AddressExtraFieldType';
  /** The extra field name */
  fieldName?: Maybe<Scalars['String']['output']>;
  /** The extra field value */
  fieldValue?: Maybe<Scalars['String']['output']>;
};

export type AddressFormFieldsInputType = {
  /** The name of address form fields. Required */
  name: Scalars['String']['input'];
  /** The value of address form fields. Required */
  value: Scalars['GenericScalar']['input'];
};

export type AddressFormFieldsType = {
  __typename?: 'AddressFormFieldsType';
  /** The Customer Address ID. */
  addressId?: Maybe<Scalars['String']['output']>;
  /** The form field name. Required */
  name: Scalars['String']['output'];
  /** The value of address form fields. Required */
  value: Scalars['GenericScalar']['output'];
};

export type AddressInputType = {
  /** The address line 1. Required */
  addressLine1: Scalars['String']['input'];
  /** The address line 2 */
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  /** The city name. Required */
  city: Scalars['String']['input'];
  /** The address company */
  company?: InputMaybe<Scalars['String']['input']>;
  /** The id of company. Required */
  companyId: Scalars['Int']['input'];
  /** The full country name. Required */
  country: Scalars['String']['input'];
  /** The iso2 code of country, like US. Required */
  countryCode: Scalars['String']['input'];
  /** The extra fields */
  extraFields?: InputMaybe<Array<InputMaybe<AddressExtraFieldInputType>>>;
  /** The first name of address. Required */
  firstName: Scalars['String']['input'];
  /** Is this address used for billing. 1 means true, 0 means false */
  isBilling?: InputMaybe<Scalars['Int']['input']>;
  /** Is this address is the default billing address.1 means true, 0 means false */
  isDefaultBilling?: InputMaybe<Scalars['Int']['input']>;
  /** Is this address is the default shipping address.1 means true, 0 means false */
  isDefaultShipping?: InputMaybe<Scalars['Int']['input']>;
  /** Is this address used for shipping. 1 means true, 0 means false */
  isShipping?: InputMaybe<Scalars['Int']['input']>;
  /** The address label */
  label?: InputMaybe<Scalars['String']['input']>;
  /** The last name of address. Required */
  lastName: Scalars['String']['input'];
  /** The phone number */
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  /** The full state name. Required */
  state: Scalars['String']['input'];
  /** The iso2 code of state */
  stateCode?: InputMaybe<Scalars['String']['input']>;
  /** The uuid of address */
  uuid?: InputMaybe<Scalars['String']['input']>;
  /** The zip code. Required */
  zipCode: Scalars['String']['input'];
};

export type AddressStoreConfigType = {
  __typename?: 'AddressStoreConfigType';
  /** The enabled of store config.Required */
  isEnabled?: Maybe<Scalars['String']['output']>;
  /** The key of store config.Required */
  key?: Maybe<Scalars['String']['output']>;
};

export type AddressType = Node & {
  __typename?: 'AddressType';
  address?: Maybe<Scalars['String']['output']>;
  addressLine1?: Maybe<Scalars['String']['output']>;
  addressLine2?: Maybe<Scalars['String']['output']>;
  city: Scalars['String']['output'];
  /** The company of address */
  company?: Maybe<Scalars['String']['output']>;
  country: Scalars['String']['output'];
  countryCode?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Int']['output'];
  /** List of address extra fields */
  extraFields?: Maybe<Array<Maybe<AddressExtraFieldType>>>;
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  isActive: Scalars['Int']['output'];
  /** Is this address used for billing. 1 means true, 0 means false */
  isBilling?: Maybe<Scalars['Int']['output']>;
  /** Is this address is the default billing address.1 means true, 0 means false */
  isDefaultBilling?: Maybe<Scalars['Int']['output']>;
  /** Is this address is the default shipping address.1 means true, 0 means false */
  isDefaultShipping?: Maybe<Scalars['Int']['output']>;
  /** Is this address used for shipping. 1 means true, 0 means false */
  isShipping?: Maybe<Scalars['Int']['output']>;
  label?: Maybe<Scalars['String']['output']>;
  lastName: Scalars['String']['output'];
  phoneNumber?: Maybe<Scalars['String']['output']>;
  state?: Maybe<Scalars['String']['output']>;
  stateCode?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Int']['output'];
  /** The uuid of address */
  uuid?: Maybe<Scalars['String']['output']>;
  zipCode?: Maybe<Scalars['String']['output']>;
};

export type AddressTypeCountableConnection = {
  __typename?: 'AddressTypeCountableConnection';
  edges: Array<AddressTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type AddressTypeCountableEdge = {
  __typename?: 'AddressTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: AddressType;
};

/**
 * Update a company address.
 * Requires a B2B Token.
 */
export type AddressUpdate = {
  __typename?: 'AddressUpdate';
  address?: Maybe<AddressType>;
};

export type AddressUpdateType = {
  /** The id of address. Required */
  addressId: Scalars['Int']['input'];
  /** The address line 1. Required */
  addressLine1: Scalars['String']['input'];
  /** The address line 2 */
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  /** The city name. Required */
  city: Scalars['String']['input'];
  /** The address company */
  company?: InputMaybe<Scalars['String']['input']>;
  /** The id of company. Required */
  companyId: Scalars['Int']['input'];
  /** The full country name. Required */
  country: Scalars['String']['input'];
  /** The iso2 code of country, like US. Required */
  countryCode: Scalars['String']['input'];
  /** The extra fields */
  extraFields?: InputMaybe<Array<InputMaybe<AddressExtraFieldInputType>>>;
  /** The first name of address. Required */
  firstName: Scalars['String']['input'];
  /** Is this address used for billing. 1 means true, 0 means false */
  isBilling?: InputMaybe<Scalars['Int']['input']>;
  /** Is this address is the default billing address.1 means true, 0 means false */
  isDefaultBilling?: InputMaybe<Scalars['Int']['input']>;
  /** Is this address is the default shipping address.1 means true, 0 means false */
  isDefaultShipping?: InputMaybe<Scalars['Int']['input']>;
  /** Is this address used for shipping. 1 means true, 0 means false */
  isShipping?: InputMaybe<Scalars['Int']['input']>;
  /** The address label */
  label?: InputMaybe<Scalars['String']['input']>;
  /** The last name of address. Required */
  lastName: Scalars['String']['input'];
  /** The phone number */
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  /** The full state name. Required */
  state: Scalars['String']['input'];
  /** The iso2 code of state */
  stateCode?: InputMaybe<Scalars['String']['input']>;
  /** The uuid of address */
  uuid?: InputMaybe<Scalars['String']['input']>;
  /** The zip code. Required */
  zipCode: Scalars['String']['input'];
};

export type AuthRolePermissionType = {
  __typename?: 'AuthRolePermissionType';
  /** The permission code */
  code?: Maybe<Scalars['String']['output']>;
  /** The permission level */
  permissionLevel?: Maybe<Scalars['Int']['output']>;
};

export type BcInfomation = {
  __typename?: 'BCInfomation';
  /** BC customer group name */
  bcGroupName?: Maybe<Scalars['String']['output']>;
  /** BC customer group ID */
  bcId?: Maybe<Scalars['Int']['output']>;
  /** BC customer group site url */
  bcUrl?: Maybe<Scalars['String']['output']>;
  /** B2B Edition company name */
  customerName?: Maybe<Scalars['String']['output']>;
};

export type BaseShoppingListItem = Node & {
  __typename?: 'BaseShoppingListItem';
  createdAt?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  /** Shopping list item ID */
  itemId?: Maybe<Scalars['Int']['output']>;
  /** Product option list */
  optionList?: Maybe<Scalars['GenericScalar']['output']>;
  /** Product ID */
  productId?: Maybe<Scalars['Int']['output']>;
  /** Product note */
  productNote?: Maybe<Scalars['String']['output']>;
  /** SKU name */
  productSku?: Maybe<Scalars['String']['output']>;
  /** Quantity */
  quantity?: Maybe<Scalars['Int']['output']>;
  updatedAt?: Maybe<Scalars['Int']['output']>;
  /** Product variant id */
  variantId?: Maybe<Scalars['Int']['output']>;
};

export type BaseShoppingListItemCountableConnection = {
  __typename?: 'BaseShoppingListItemCountableConnection';
  edges: Array<BaseShoppingListItemCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type BaseShoppingListItemCountableEdge = {
  __typename?: 'BaseShoppingListItemCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: BaseShoppingListItem;
};

export type BcCartInputType = {
  /**
   * Currency code like USD.
   * This field is required
   */
  currency: Scalars['String']['input'];
  /**
   * The payment details.
   * This field is required
   */
  details: Scalars['GenericScalar']['input'];
  /**
   * Invoice items you want to pay.
   * This field is required
   */
  lineItems: Array<InputMaybe<InvoiceLineItemsInputType>>;
};

export type BcOrderAllowMethodsType = {
  __typename?: 'BcOrderAllowMethodsType';
  /** List of BC allow methods */
  allowMethods?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type BcOrderType = {
  __typename?: 'BcOrderType';
  /** The value of the base handling cost */
  baseHandlingCost?: Maybe<Scalars['String']['output']>;
  /** The value of the base shipping cost. */
  baseShippingCost?: Maybe<Scalars['String']['output']>;
  /** The value of the base wrapping cost. */
  baseWrappingCost?: Maybe<Scalars['String']['output']>;
  /** Order's billing address */
  billingAddress?: Maybe<Scalars['GenericScalar']['output']>;
  /** whether can return */
  canReturn?: Maybe<Scalars['Boolean']['output']>;
  /** The cart ID from which this order originated, */
  cartId?: Maybe<Scalars['String']['output']>;
  /** Shows where the order originated. The channel_id will default to 1. */
  channelId?: Maybe<Scalars['String']['output']>;
  /** The order's company name */
  companyName?: Maybe<Scalars['String']['output']>;
  /** coupon discount value */
  couponDiscount?: Maybe<Scalars['String']['output']>;
  /** Order coupons */
  coupons?: Maybe<Scalars['GenericScalar']['output']>;
  /** Order owner's email */
  createdEmail?: Maybe<Scalars['String']['output']>;
  /** credit card type */
  creditCardType?: Maybe<Scalars['String']['output']>;
  /** The currency code of the display currency used to present prices on the storefront. */
  currencyCode?: Maybe<Scalars['String']['output']>;
  /** The exchange rate between the store’s default currency and the display currency. */
  currencyExchangeRate?: Maybe<Scalars['String']['output']>;
  /** The display currency ID. */
  currencyId?: Maybe<Scalars['Int']['output']>;
  /** The custom status of the order */
  customStatus?: Maybe<Scalars['String']['output']>;
  /** The order owner's id */
  customerId?: Maybe<Scalars['Int']['output']>;
  /** The customer’s locale */
  customerLocale?: Maybe<Scalars['String']['output']>;
  /** Message that the customer entered */
  customerMessage?: Maybe<Scalars['String']['output']>;
  /** The date the order was created, formatted in the RFC-2822 standard. */
  dateCreated?: Maybe<Scalars['String']['output']>;
  /** representing the last modification of the order. */
  dateModified?: Maybe<Scalars['String']['output']>;
  /** representing the date of shipment. */
  dateShipped?: Maybe<Scalars['String']['output']>;
  /** The currency code of the transactional currency the shopper pays in */
  defaultCurrencyCode?: Maybe<Scalars['String']['output']>;
  /** The transactional currency ID */
  defaultCurrencyId?: Maybe<Scalars['Int']['output']>;
  /** Amount of discount for this transaction.  */
  discountAmount?: Maybe<Scalars['String']['output']>;
  /** If the order was placed through eBay, the eBay order number will be included. Otherwise, the value will be 0. */
  ebayOrderId?: Maybe<Scalars['String']['output']>;
  /** ID of the order in another system. */
  externalId?: Maybe<Scalars['String']['output']>;
  /** external merchant id */
  externalMerchantId?: Maybe<Scalars['String']['output']>;
  /** external order id */
  externalOrderId?: Maybe<Scalars['String']['output']>;
  /** This value identifies an external system that generated the order and submitted it to BigCommerce via the Orders API */
  externalSource?: Maybe<Scalars['String']['output']>;
  /** extra fields set by b3 */
  extraFields?: Maybe<Scalars['GenericScalar']['output']>;
  /** extra info */
  extraInfo?: Maybe<Scalars['GenericScalar']['output']>;
  /** extra int 1 */
  extraInt1?: Maybe<Scalars['Int']['output']>;
  /** extra int 2 */
  extraInt2?: Maybe<Scalars['Int']['output']>;
  /** extra int 3 */
  extraInt3?: Maybe<Scalars['Int']['output']>;
  /** extra int 4 */
  extraInt4?: Maybe<Scalars['Int']['output']>;
  /** extra int 5 */
  extraInt5?: Maybe<Scalars['Int']['output']>;
  /** extra str 1 */
  extraStr1?: Maybe<Scalars['String']['output']>;
  /** extra str 2 */
  extraStr2?: Maybe<Scalars['String']['output']>;
  /** extra str 3 */
  extraStr3?: Maybe<Scalars['String']['output']>;
  /** extra str 4 */
  extraStr4?: Maybe<Scalars['String']['output']>;
  /** extra str 5 */
  extraStr5?: Maybe<Scalars['String']['output']>;
  /** extra text */
  extraText?: Maybe<Scalars['String']['output']>;
  /** The order owner's first name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** The full name of the country where the customer made the purchase, based on the IP. */
  geoipCountry?: Maybe<Scalars['String']['output']>;
  /** The country where the customer made the purchase, in ISO2 format, based on the IP */
  geoipCountryIso2?: Maybe<Scalars['String']['output']>;
  /** gift certificate amount */
  giftCertificateAmount?: Maybe<Scalars['String']['output']>;
  /** The value of the handling cost, excluding tax. */
  handlingCostExTax?: Maybe<Scalars['String']['output']>;
  /** The value of the handling cost, including tax. */
  handlingCostIncTax?: Maybe<Scalars['String']['output']>;
  /** handling cost tax */
  handlingCostTax?: Maybe<Scalars['String']['output']>;
  /** Value ignored if automatic tax is enabled on the store. */
  handlingCostTaxClassId?: Maybe<Scalars['Int']['output']>;
  /** The ID of the order. */
  id: Scalars['ID']['output'];
  /** invoice id */
  invoiceId?: Maybe<Scalars['Int']['output']>;
  /** IPv4 Address of the customer, if known */
  ipAddress?: Maybe<Scalars['String']['output']>;
  /** IPv6 Address of the customer, if known. */
  ipAddressV6?: Maybe<Scalars['String']['output']>;
  /** invoice status */
  ipStatus?: Maybe<Scalars['Int']['output']>;
  /** Indicates whether the order was deleted (archived). */
  isDeleted?: Maybe<Scalars['Boolean']['output']>;
  /** Indicates whether the shopper has selected an opt-in check box (on the checkout page) to receive emails. */
  isEmailOptIn?: Maybe<Scalars['Boolean']['output']>;
  /** Indicate if order is in Invoice */
  isInvoiceOrder?: Maybe<Scalars['Int']['output']>;
  /** The number of items that have been shipped. */
  itemsShipped?: Maybe<Scalars['Int']['output']>;
  /** The total number of items in the order. */
  itemsTotal?: Maybe<Scalars['Int']['output']>;
  /** The order owner's last name */
  lastName?: Maybe<Scalars['String']['output']>;
  /** Currency info of order */
  money?: Maybe<Scalars['GenericScalar']['output']>;
  /** order's history event */
  orderHistoryEvent?: Maybe<Array<Maybe<OrderHistoryEventType>>>;
  /** Whether this is an order for digital products. */
  orderIsDigital?: Maybe<Scalars['Boolean']['output']>;
  /** Orders submitted via the store’s website will include a www value. */
  orderSource?: Maybe<Scalars['String']['output']>;
  /** The payment method for this order. Can be one of the following: Manual, Credit Card, cash, Test Payment Gateway, etc. */
  paymentMethod?: Maybe<Scalars['String']['output']>;
  /** The external Transaction ID/Payment ID within this order’s payment provider */
  paymentProviderId?: Maybe<Scalars['String']['output']>;
  /** payment status */
  paymentStatus?: Maybe<Scalars['String']['output']>;
  /** PO number of the order */
  poNumber?: Maybe<Scalars['String']['output']>;
  /** Order products */
  products?: Maybe<Scalars['GenericScalar']['output']>;
  /** Reference number of order */
  referenceNumber?: Maybe<Scalars['String']['output']>;
  /** The amount refunded from this transaction. */
  refundedAmount?: Maybe<Scalars['String']['output']>;
  /** Order's shipments */
  shipments?: Maybe<Scalars['GenericScalar']['output']>;
  /** Order's shipping address */
  shippingAddress?: Maybe<Scalars['GenericScalar']['output']>;
  /** The number of shipping addresses associated with this transaction. */
  shippingAddressCount?: Maybe<Scalars['Int']['output']>;
  /** Order's shipping address */
  shippingAddresses?: Maybe<Scalars['GenericScalar']['output']>;
  /** The value of shipping cost, excluding tax. */
  shippingCostExTax?: Maybe<Scalars['String']['output']>;
  /** The value of shipping cost, including tax. */
  shippingCostIncTax?: Maybe<Scalars['String']['output']>;
  /** shipping cost tax */
  shippingCostTax?: Maybe<Scalars['String']['output']>;
  /** Shipping-cost tax class. */
  shippingCostTaxClassId?: Maybe<Scalars['String']['output']>;
  /** Any additional notes for staff. */
  staffNotes?: Maybe<Scalars['String']['output']>;
  /** The status will include one of the (string, optiona) - values defined under Order Statuses */
  status?: Maybe<Scalars['String']['output']>;
  /** The staus ID of the order. */
  statusId?: Maybe<Scalars['Int']['output']>;
  /** Represents the store credit that the shopper has redeemed on this individual order. */
  storeCreditAmount?: Maybe<Scalars['String']['output']>;
  /** default currency code */
  storeDefaultCurrencyCode?: Maybe<Scalars['String']['output']>;
  /** store default to transactional exchange_rate */
  storeDefaultToTransactionalExchangeRate?: Maybe<Scalars['String']['output']>;
  /** Override value for subtotal excluding tax. */
  subtotalExTax?: Maybe<Scalars['String']['output']>;
  /** Override value for subtotal including tax. */
  subtotalIncTax?: Maybe<Scalars['String']['output']>;
  /** subtotal tax */
  subtotalTax?: Maybe<Scalars['String']['output']>;
  /** BasicTaxProvider - Tax is set to manual. */
  taxProviderId?: Maybe<Scalars['String']['output']>;
  /** Override value for the total, excluding tax. */
  totalExTax?: Maybe<Scalars['String']['output']>;
  /** Override value for the total, including tax. */
  totalIncTax?: Maybe<Scalars['String']['output']>;
  /** total tax */
  totalTax?: Maybe<Scalars['String']['output']>;
  /** update time */
  updatedAt?: Maybe<Scalars['String']['output']>;
  /** The value of the wrapping cost, excluding tax.  */
  wrappingCostExTax?: Maybe<Scalars['String']['output']>;
  /** The value of the wrapping cost, including tax.  */
  wrappingCostIncTax?: Maybe<Scalars['String']['output']>;
  /** wrapping cost tax */
  wrappingCostTax?: Maybe<Scalars['String']['output']>;
  /** Value ignored if automatic tax is enabled on the store. */
  wrappingCostTaxClassId?: Maybe<Scalars['Int']['output']>;
};

export type BillingAddressInputType = {
  address?: InputMaybe<Scalars['String']['input']>;
  addressId?: InputMaybe<Scalars['Int']['input']>;
  addressLine1?: InputMaybe<Scalars['String']['input']>;
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  apartment?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  extraFields?: InputMaybe<Array<InputMaybe<QuoteAddressExtraFieldsInputType>>>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export type BulkPricingType = {
  __typename?: 'BulkPricingType';
  /** The discount amount for this bulk pricing discount. */
  discountAmount?: Maybe<Scalars['Float']['output']>;
  /** The type of discount for this bulk pricing discount. Allowed: price | percent | fixed */
  discountType?: Maybe<Scalars['String']['output']>;
  /** The maximum quantity (or 0 for unlimited) to trigger this bulk pricing discount. */
  maximum?: Maybe<Scalars['Int']['output']>;
  /** The minimum quantity required to trigger this bulk pricing discount. */
  minimum?: Maybe<Scalars['Int']['output']>;
  /** Formats the bulk_pricing.discount_amount into the tax price amounts. */
  taxDiscountAmount?: Maybe<Array<Maybe<PriceType>>>;
};

export type CatalogQuickProductType = {
  __typename?: 'CatalogQuickProductType';
  /** The base sku of product.Required */
  baseSku?: Maybe<Scalars['String']['output']>;
  /** The price of the product as seen on the storefront.Required */
  calculatedPrice?: Maybe<Scalars['String']['output']>;
  /** The categories of product */
  categories?: Maybe<Array<Maybe<Scalars['JSONString']['output']>>>;
  /** The image URL path of product.Required */
  imageUrl?: Maybe<Scalars['String']['output']>;
  /** The is stock of inventory tracking.Required */
  isStock?: Maybe<Scalars['String']['output']>;
  /** Whether the product should be displayed to customers.1 means true, 0 means false.Required */
  isVisible?: Maybe<Scalars['String']['output']>;
  /** The maximum quantity in an order.Required */
  maxQuantity?: Maybe<Scalars['Int']['output']>;
  /** The minimum quantity in an order.Required */
  minQuantity?: Maybe<Scalars['Int']['output']>;
  /** The modifiers sku of product */
  modifiers?: Maybe<Array<Maybe<Scalars['GenericScalar']['output']>>>;
  /** The option of product */
  option?: Maybe<Array<Maybe<Scalars['GenericScalar']['output']>>>;
  /** The id of product.Required */
  productId?: Maybe<Scalars['String']['output']>;
  /** The name of product.Required */
  productName?: Maybe<Scalars['String']['output']>;
  /** Whether this variant will  be purchasable on the storefront */
  purchasingDisabled?: Maybe<Scalars['String']['output']>;
  /** The stock of inventory tracking.Required */
  stock?: Maybe<Scalars['Int']['output']>;
  /** The variant id of product.Required */
  variantId?: Maybe<Scalars['String']['output']>;
  /** The variant sku of product */
  variantSku?: Maybe<Scalars['String']['output']>;
};

export type CatalogsVariantType = {
  __typename?: 'CatalogsVariantType';
  /** The sku of product.Required */
  sku?: Maybe<Scalars['String']['output']>;
  /** The variant id  of product.Required */
  variantId?: Maybe<Scalars['Int']['output']>;
};

export type CheckoutConfigType = {
  __typename?: 'CheckoutConfigType';
  /** The name of store config.Required */
  configName?: Maybe<Scalars['String']['output']>;
  /** The id of store config.Required */
  id?: Maybe<Scalars['Int']['output']>;
  /** The type of store config.Required */
  type?: Maybe<Scalars['String']['output']>;
  /** The value of store config.Required */
  value?: Maybe<Scalars['String']['output']>;
};

export type CheckoutLoginType = {
  /** BC cart id for checkout. Required */
  cartId: Scalars['String']['input'];
};

export type CheckoutResultLoginType = {
  __typename?: 'CheckoutResultLoginType';
  /** Redirect URL to login into checkout */
  redirectUrl?: Maybe<Scalars['String']['output']>;
};

export type CompanyAddressExtraField = {
  fieldName: Scalars['String']['input'];
  fieldValue: Scalars['String']['input'];
};

export type CompanyAttachedFile = {
  /** file name of this attached */
  fileName: Scalars['String']['input'];
  /** file size of this attached */
  fileSize?: InputMaybe<Scalars['String']['input']>;
  /** file type of this attached */
  fileType: Scalars['String']['input'];
  /** file url of this attached */
  fileUrl: Scalars['String']['input'];
};

/** Create a company using a customer id. */
export type CompanyCreate = {
  __typename?: 'CompanyCreate';
  company?: Maybe<CompanyType>;
};

export type CompanyCreditConfigType = {
  __typename?: 'CompanyCreditConfigType';
  /** The available credit value */
  availableCredit?: Maybe<Scalars['Float']['output']>;
  /** Currency code of credit available credit */
  creditCurrency?: Maybe<Scalars['String']['output']>;
  /** Is company credit enabled */
  creditEnabled?: Maybe<Scalars['Boolean']['output']>;
  /** Prevent all company users from making purchase */
  creditHold?: Maybe<Scalars['Boolean']['output']>;
  /** All currency info, contains currency symbol, decimal place, etc. */
  currency?: Maybe<Scalars['GenericScalar']['output']>;
  /** Disable via PO Payment when credit value is exceed */
  limitPurchases?: Maybe<Scalars['Boolean']['output']>;
};

export type CompanyEmailUserInfoType = {
  __typename?: 'CompanyEmailUserInfoType';
  /** User company role */
  companyRoleId?: Maybe<Scalars['Int']['output']>;
  /** User company role name */
  companyRoleName?: Maybe<Scalars['String']['output']>;
  /** User's email */
  email?: Maybe<Scalars['String']['output']>;
  /** User's first name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** Is user's password reset on login */
  forcePasswordReset?: Maybe<Scalars['Boolean']['output']>;
  /** Unique user ID */
  id?: Maybe<Scalars['Int']['output']>;
  /** User's last name */
  lastName?: Maybe<Scalars['String']['output']>;
  /** User's phone number */
  phoneNumber?: Maybe<Scalars['String']['output']>;
  /** User role */
  role?: Maybe<Scalars['Int']['output']>;
};

export type CompanyEmailValidateType = {
  __typename?: 'CompanyEmailValidateType';
  /** Is valid of this email */
  isValid?: Maybe<Scalars['Boolean']['output']>;
  userInfo?: Maybe<CompanyEmailUserInfoType>;
};

export type CompanyExtraField = {
  fieldName: Scalars['String']['input'];
  fieldValue: Scalars['String']['input'];
};

export type CompanyInfoType = {
  __typename?: 'CompanyInfoType';
  bcId?: Maybe<Scalars['String']['output']>;
  companyAddress?: Maybe<Scalars['String']['output']>;
  companyCity?: Maybe<Scalars['String']['output']>;
  companyCountry?: Maybe<Scalars['String']['output']>;
  companyId?: Maybe<Scalars['String']['output']>;
  companyName?: Maybe<Scalars['String']['output']>;
  companyState?: Maybe<Scalars['String']['output']>;
  companyZipCode?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
};

export type CompanyInputType = {
  /** extra fields of this address */
  addressExtraFields?: InputMaybe<Array<InputMaybe<CompanyAddressExtraField>>>;
  /**
   * Company address line.
   * This field is required.
   */
  addressLine1: Scalars['String']['input'];
  /** Another company address line */
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  /** Admin user's channel ID of this company */
  channelId?: InputMaybe<Scalars['Int']['input']>;
  /**
   * City where company is located.
   * This field is required.
   */
  city: Scalars['String']['input'];
  /** Company email */
  companyEmail?: InputMaybe<Scalars['String']['input']>;
  /**
   * Company name.
   * This field is required.
   */
  companyName: Scalars['String']['input'];
  /** Company phone number. */
  companyPhoneNumber?: InputMaybe<Scalars['String']['input']>;
  /**
   * Country where company is located.
   * This field is required.
   */
  country: Scalars['String']['input'];
  /**
   * Company admin manager's customer user ID in BigCommerce.
   * This field is required.
   */
  customerId: Scalars['String']['input'];
  /** extra fields of this company */
  extraFields?: InputMaybe<Array<InputMaybe<CompanyExtraField>>>;
  /** attach file list of this company */
  fileList?: InputMaybe<Array<InputMaybe<CompanyAttachedFile>>>;
  /**
   * State where company is located.
   * This field is required.
   */
  state: Scalars['String']['input'];
  /**
   * The store hash.
   * This field is required.
   */
  storeHash: Scalars['String']['input'];
  /** user extra fields */
  userExtraFields?: InputMaybe<Array<InputMaybe<CompanyUserExtraField>>>;
  /**
   * Zip Code for the company.
   * This field is required.
   */
  zipCode: Scalars['String']['input'];
};

export type CompanyPaymentTermsType = {
  __typename?: 'CompanyPaymentTermsType';
  /** The company payment terms is enabled. */
  isEnabled?: Maybe<Scalars['Boolean']['output']>;
  /** The company payment terms. If isEnabled is false, this value is the store default payment terms. */
  paymentTerms?: Maybe<Scalars['Int']['output']>;
};

export type CompanyPermissionsType = Node & {
  __typename?: 'CompanyPermissionsType';
  /** Permissions code */
  code?: Maybe<Scalars['String']['output']>;
  /** Permissions description */
  description?: Maybe<Scalars['String']['output']>;
  /** ID of the permission */
  id: Scalars['ID']['output'];
  /** Whether the permission is custom */
  isCustom?: Maybe<Scalars['Boolean']['output']>;
  /** The name of the module to which the permission belongs */
  moduleName?: Maybe<Scalars['String']['output']>;
  /** Permissions name */
  name?: Maybe<Scalars['String']['output']>;
};

export type CompanyRolePermissionsType = Node & {
  __typename?: 'CompanyRolePermissionsType';
  /** Permissions code */
  code?: Maybe<Scalars['String']['output']>;
  /** ID of the permission */
  id: Scalars['ID']['output'];
  /** Whether the permission is custom */
  isCustom?: Maybe<Scalars['Boolean']['output']>;
  /** Permissions name */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * Permissions description.
   *   1 is user level, 2 is company level
   */
  permissionLevel?: Maybe<Scalars['Int']['output']>;
};

export type CompanyRoleType = Node & {
  __typename?: 'CompanyRoleType';
  /** ID of the role */
  id: Scalars['ID']['output'];
  /** Role name */
  name?: Maybe<Scalars['String']['output']>;
  /** Permissions of the role */
  permissions?: Maybe<Array<Maybe<CompanyRolePermissionsType>>>;
  /**
   * Role level.
   *  1 is store level
   */
  roleLevel?: Maybe<Scalars['Int']['output']>;
  /**
   * Role type.
   *  1 is predefined, 2 is custom
   */
  roleType?: Maybe<Scalars['Int']['output']>;
};

export type CompanyRolesType = Node & {
  __typename?: 'CompanyRolesType';
  /** ID of the role */
  id: Scalars['ID']['output'];
  /** Role name */
  name?: Maybe<Scalars['String']['output']>;
  /**
   * Role level.
   *  1 is store level
   */
  roleLevel?: Maybe<Scalars['Int']['output']>;
  /**
   * Role type.
   *  1 is predefined, 2 is custom
   */
  roleType?: Maybe<Scalars['Int']['output']>;
};

export type CompanyRolesTypeCountableConnection = {
  __typename?: 'CompanyRolesTypeCountableConnection';
  edges: Array<CompanyRolesTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type CompanyRolesTypeCountableEdge = {
  __typename?: 'CompanyRolesTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: CompanyRolesType;
};

export type CompanyType = Node & {
  __typename?: 'CompanyType';
  /** Company address line 1 */
  addressLine1?: Maybe<Scalars['String']['output']>;
  /** Company address line 2 */
  addressLine2?: Maybe<Scalars['String']['output']>;
  /** The group name in BigCommerce's group. which must be unique */
  bcGroupName?: Maybe<Scalars['String']['output']>;
  /** Prices list ID of this company */
  catalogId?: Maybe<Scalars['String']['output']>;
  /** Company city */
  city?: Maybe<Scalars['String']['output']>;
  /** Company name */
  companyName?: Maybe<Scalars['String']['output']>;
  /** Company status */
  companyStatus?: Maybe<Scalars['Int']['output']>;
  /** Company country */
  country?: Maybe<Scalars['String']['output']>;
  /** Company customer group id */
  customerGroupId?: Maybe<Scalars['Int']['output']>;
  /** A brief introduction to the company */
  description?: Maybe<Scalars['String']['output']>;
  /** extra fields of this company */
  extraFields?: Maybe<Array<Maybe<ExtraFieldsValueType>>>;
  /** Unique ID of this company */
  id: Scalars['ID']['output'];
  /** Company state */
  state?: Maybe<Scalars['String']['output']>;
  /** Zip code of company city */
  zipCode?: Maybe<Scalars['String']['output']>;
};

export type CompanyUserExtraField = {
  fieldName: Scalars['String']['input'];
  fieldValue: Scalars['String']['input'];
};

export type CompanyUserInfoType = {
  __typename?: 'CompanyUserInfoType';
  userInfo?: Maybe<CompanyEmailUserInfoType>;
  /** The user type of current email.
   * 1 means user does't exist.
   * 2 means the user exists in BigCommerce.
   * 3 means the user exists in B2B Edition. */
  userType?: Maybe<Scalars['Int']['output']>;
};

export type ContactInfoInputType = {
  companyName?: InputMaybe<Scalars['String']['input']>;
  email: Scalars['String']['input'];
  name: Scalars['String']['input'];
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type CountryType = {
  __typename?: 'CountryType';
  /** The country iso2 code */
  countryCode?: Maybe<Scalars['String']['output']>;
  /** The country name */
  countryName?: Maybe<Scalars['String']['output']>;
  /** The id of country */
  id?: Maybe<Scalars['String']['output']>;
  /** List of states */
  states?: Maybe<Array<Maybe<StatesType>>>;
};

/**
 * Create a BC cart for invoice payment.
 * Only Admin and Super Admin can create cart.
 * Requires a B2B Token.
 */
export type CreateBcCartMutation = {
  __typename?: 'CreateBcCartMutation';
  result?: Maybe<PaymentBcCartType>;
};

export type CreateByType = {
  __typename?: 'CreateByType';
  results?: Maybe<Scalars['GenericScalar']['output']>;
};

export type Currencies = {
  __typename?: 'Currencies';
  /** The auto update of store currency.Required */
  auto_update?: Maybe<Scalars['Boolean']['output']>;
  /** The iso2 code of country, like US */
  country_iso2?: Maybe<Scalars['String']['output']>;
  /** The currency code of store currency */
  currency_code?: Maybe<Scalars['String']['output']>;
  /** The currency exchange rate of store currency.Required */
  currency_exchange_rate?: Maybe<Scalars['String']['output']>;
  /** The decimal places of store currency.Required */
  decimal_places?: Maybe<Scalars['Int']['output']>;
  /** The decimal token of store currency.Required */
  decimal_token?: Maybe<Scalars['String']['output']>;
  /** The default country code of store currency */
  default_for_country_codes?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** Store currency Whether is enabled.Required */
  enabled?: Maybe<Scalars['Boolean']['output']>;
  /** The id of store currency.Required */
  id?: Maybe<Scalars['String']['output']>;
  /** Whether is default store currency.Required */
  is_default?: Maybe<Scalars['Boolean']['output']>;
  /** Store currency Whether is transactional.Required */
  is_transactional?: Maybe<Scalars['Boolean']['output']>;
  /** The last update of store currency.Required */
  last_updated?: Maybe<Scalars['String']['output']>;
  /** The name of store currency.Required */
  name?: Maybe<Scalars['String']['output']>;
  /** Symbol used as the thousands separator in this currency */
  thousands_token?: Maybe<Scalars['String']['output']>;
  /** The token of store currency.Required */
  token?: Maybe<Scalars['String']['output']>;
  /** Specifies whether this currency’s symbol appears to the “left” or “right” of the numeric amount */
  token_location?: Maybe<Scalars['String']['output']>;
};

export type CurrencyInputType = {
  /** Currency code */
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  /** Currency rate */
  currencyExchangeRate?: InputMaybe<Scalars['String']['input']>;
  /** Number of decimal places */
  decimalPlaces?: InputMaybe<Scalars['CurrencyDecimalPlaces']['input']>;
  /** Decimal separator */
  decimalToken?: InputMaybe<Scalars['String']['input']>;
  /** Currency token position, left or right */
  location?: InputMaybe<Scalars['String']['input']>;
  /** Thousands separator */
  thousandsToken?: InputMaybe<Scalars['String']['input']>;
  /** Currency token, such as $ */
  token?: InputMaybe<Scalars['String']['input']>;
};

export type CustomerAccountSettingsType = {
  __typename?: 'CustomerAccountSettingsType';
  /** Company for user */
  company?: Maybe<Scalars['String']['output']>;
  /** User email */
  email?: Maybe<Scalars['String']['output']>;
  /** User first name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** List of address form fields */
  formFields?: Maybe<Array<Maybe<FormFieldsType>>>;
  /** User last name */
  lastName?: Maybe<Scalars['String']['output']>;
  /** User phone number */
  phoneNumber?: Maybe<Scalars['String']['output']>;
};

/**
 * Create a customer address.
 * Requires a BC Token.
 */
export type CustomerAddressCreate = {
  __typename?: 'CustomerAddressCreate';
  address?: Maybe<CustomerAddressType>;
};

/**
 * Delete a customer address.
 * Requires a BC Token.
 */
export type CustomerAddressDelete = {
  __typename?: 'CustomerAddressDelete';
  message?: Maybe<Scalars['String']['output']>;
};

export type CustomerAddressInputType = {
  /** The address line 1. Required */
  address1: Scalars['String']['input'];
  /** The address line 2 */
  address2?: InputMaybe<Scalars['String']['input']>;
  /** The address type. Residential or Commercial */
  addressType?: InputMaybe<Scalars['String']['input']>;
  /** The city name. Required */
  city: Scalars['String']['input'];
  /** The company of address. */
  company?: InputMaybe<Scalars['String']['input']>;
  /** The iso2 code of country, like US. Required */
  countryCode: Scalars['String']['input'];
  /** The first name of address. Required */
  firstName: Scalars['String']['input'];
  /** Form fields */
  formFields?: InputMaybe<Array<InputMaybe<AddressFormFieldsInputType>>>;
  /** The last name of address. Required */
  lastName: Scalars['String']['input'];
  /** The phone of address. */
  phone?: InputMaybe<Scalars['String']['input']>;
  /** The postal code of address. Required */
  postalCode: Scalars['String']['input'];
  /** The city name. Required */
  stateOrProvince: Scalars['String']['input'];
};

export type CustomerAddressType = Node & {
  __typename?: 'CustomerAddressType';
  address1: Scalars['String']['output'];
  address2: Scalars['String']['output'];
  addressType: Scalars['String']['output'];
  bcAddressId: Scalars['Int']['output'];
  city: Scalars['String']['output'];
  company: Scalars['String']['output'];
  country: Scalars['String']['output'];
  countryCode: Scalars['String']['output'];
  createdAt: Scalars['Int']['output'];
  firstName: Scalars['String']['output'];
  /** List of address form fields */
  formFields?: Maybe<Array<Maybe<AddressFormFieldsType>>>;
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  phone: Scalars['String']['output'];
  postalCode: Scalars['String']['output'];
  stateOrProvince: Scalars['String']['output'];
  updatedAt: Scalars['Int']['output'];
};

export type CustomerAddressTypeCountableConnection = {
  __typename?: 'CustomerAddressTypeCountableConnection';
  edges: Array<CustomerAddressTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type CustomerAddressTypeCountableEdge = {
  __typename?: 'CustomerAddressTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: CustomerAddressType;
};

/**
 * Update a customer address.
 * Requires a BC Token.
 */
export type CustomerAddressUpdate = {
  __typename?: 'CustomerAddressUpdate';
  address?: Maybe<CustomerAddressType>;
};

export type CustomerAddressUpdateType = {
  /** The address line 1. Required */
  address1: Scalars['String']['input'];
  /** The address line 2 */
  address2?: InputMaybe<Scalars['String']['input']>;
  /** The address type. Residential or Commercial */
  addressType?: InputMaybe<Scalars['String']['input']>;
  /** The bc id of address. Required */
  bcAddressId: Scalars['Int']['input'];
  /** The city name. Required */
  city: Scalars['String']['input'];
  /** The company of address. */
  company?: InputMaybe<Scalars['String']['input']>;
  /** The iso2 code of country, like US. Required */
  countryCode: Scalars['String']['input'];
  /** The first name of address. Required */
  firstName: Scalars['String']['input'];
  /** Form fields */
  formFields?: InputMaybe<Array<InputMaybe<AddressFormFieldsInputType>>>;
  /** The last name of address. Required */
  lastName: Scalars['String']['input'];
  /** The phone of address. */
  phone?: InputMaybe<Scalars['String']['input']>;
  /** The postal code of address. Required */
  postalCode: Scalars['String']['input'];
  /** The city name. Required */
  stateOrProvince: Scalars['String']['input'];
};

export type CustomerAddressesType = {
  __typename?: 'CustomerAddressesType';
  /** The address 1 line. */
  address1?: Maybe<Scalars['String']['output']>;
  /** The address 2 line. */
  address2?: Maybe<Scalars['String']['output']>;
  /** The address type. Residential or Commercial. */
  addressType?: Maybe<Scalars['String']['output']>;
  /** The city of the customer address. */
  city?: Maybe<Scalars['String']['output']>;
  /** The company of the customer address. */
  company?: Maybe<Scalars['String']['output']>;
  /** The country of the customer address. */
  country?: Maybe<Scalars['String']['output']>;
  /** The country code of the customer address. */
  countryCode?: Maybe<Scalars['String']['output']>;
  /** The id of the customer. */
  customerId?: Maybe<Scalars['Int']['output']>;
  /** The first name of the customer address */
  firstName?: Maybe<Scalars['String']['output']>;
  /** Array of form fields. */
  formFields?: Maybe<Array<Maybe<FormFieldsType>>>;
  /** The id of the customer address. */
  id?: Maybe<Scalars['Int']['output']>;
  /** The last name of the customer address */
  lastName?: Maybe<Scalars['String']['output']>;
  /** The phone number of the customer address. */
  phone?: Maybe<Scalars['String']['output']>;
  /** The postal code of the customer address. */
  postalCode?: Maybe<Scalars['String']['output']>;
  /** The state or province of the customer address. */
  stateOrProvince?: Maybe<Scalars['String']['output']>;
};

export type CustomerAttributeInputType = {
  /**
   * The attribute id.
   * This field is required
   */
  attributeId: Scalars['Int']['input'];
  /**
   * The attribute value.
   * This field is required
   */
  attributeValue: Scalars['String']['input'];
};

export type CustomerAttributeType = {
  __typename?: 'CustomerAttributeType';
  /** The attribute id. */
  attributeId?: Maybe<Scalars['Int']['output']>;
  /** The attribute value. */
  attributeValue?: Maybe<Scalars['String']['output']>;
  /** The id of the customer. */
  customerId?: Maybe<Scalars['Int']['output']>;
  /** The date the customer attribute was created. */
  dateCreated?: Maybe<Scalars['String']['output']>;
  /** The date the customer attribute was modified. */
  dateModified?: Maybe<Scalars['String']['output']>;
  /** The id of the customer attribute. */
  id?: Maybe<Scalars['Int']['output']>;
};

export type CustomerAuthenticationInputType = {
  /** If true, this customer will be forced to change password on next login. */
  forcePasswordReset?: InputMaybe<Scalars['Boolean']['input']>;
  /** New password for the customer. */
  newPassword?: InputMaybe<Scalars['String']['input']>;
};

export type CustomerAuthenticationType = {
  __typename?: 'CustomerAuthenticationType';
  /** If true, this customer will be forced to change password on next login. */
  forcePasswordReset?: Maybe<Scalars['Boolean']['output']>;
};

/** Create a new Bigcommerce customer */
export type CustomerCreate = {
  __typename?: 'CustomerCreate';
  customer?: Maybe<CustomerType>;
};

export type CustomerEmailCheckType = {
  __typename?: 'CustomerEmailCheckType';
  /** 1: not exist; 2: exist in BC; 3: exist in BC other channel;  */
  userType?: Maybe<Scalars['Int']['output']>;
};

export type CustomerInfo = {
  __typename?: 'CustomerInfo';
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  /** User role. 0: Admin,1:Senior Buyer, 2: Junior Buyer, 3: Sales Rep */
  role?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['Int']['output']>;
};

export type CustomerInfoType = {
  __typename?: 'CustomerInfoType';
  /** User permissions */
  permissions?: Maybe<Array<Maybe<AuthRolePermissionType>>>;
  userInfo?: Maybe<CompanyEmailUserInfoType>;
  /** The user type of current email.
   * 1 - user doesn't exist (guest user).
   * 2 - b2c user (not connected to company).
   * 3 - b2b user - customer is connected to a company */
  userType?: Maybe<Scalars['Int']['output']>;
};

export type CustomerInputType = {
  /** It determines if the customer is signed up to receive either product review or abandoned cart emails or receive both emails. */
  acceptsProductReviewAbandonedCartEmails?: InputMaybe<Scalars['Boolean']['input']>;
  /** Array of customer addresses. Limited to 10. */
  addresses?: InputMaybe<Array<InputMaybe<CustomerAddressInputType>>>;
  /** Array of customer attributes. Limited to 10 */
  attributes?: InputMaybe<Array<InputMaybe<CustomerAttributeInputType>>>;
  /** Customer authentication information. */
  authentication?: InputMaybe<CustomerAuthenticationInputType>;
  /** Array of channels the customer can access. */
  channelIds?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  /** The company of the customer. */
  company?: InputMaybe<Scalars['String']['input']>;
  /** ID of the group which this customer belongs to. */
  customerGroupId?: InputMaybe<Scalars['Int']['input']>;
  /**
   * The email of the customer.
   * This field is required
   */
  email: Scalars['String']['input'];
  /**
   * The first name of the customer.
   * This field is required
   */
  firstName: Scalars['String']['input'];
  /** Array of form fields. */
  formFields?: InputMaybe<Array<InputMaybe<FormFieldsInputType>>>;
  /**
   * The last name of the customer.
   * This field is required
   */
  lastName: Scalars['String']['input'];
  /** The notes of the customer. */
  notes?: InputMaybe<Scalars['String']['input']>;
  /** Channel ID of the customer that has created the form. */
  originChannelId?: InputMaybe<Scalars['Int']['input']>;
  /** The phone number of the customer. */
  phone?: InputMaybe<Scalars['String']['input']>;
  /** Store credit. */
  storeCreditAmounts?: InputMaybe<Array<InputMaybe<CustomerStoreCreditAmountsInputType>>>;
  /**
   * The store hash.
   * This field is required
   */
  storeHash: Scalars['String']['input'];
  /** The tax exempt category of the customer. */
  taxExemptCategory?: InputMaybe<Scalars['String']['input']>;
  /** If true, this customer will be triggered to receive account created notification. */
  triggerAccountCreatedNotification?: InputMaybe<Scalars['Boolean']['input']>;
};

export type CustomerShoppingListIdNameType = Node & {
  __typename?: 'CustomerShoppingListIdNameType';
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
};

export type CustomerShoppingListPageType = Node & {
  __typename?: 'CustomerShoppingListPageType';
  /** The channel id of the shopping list */
  channelId?: Maybe<Scalars['Int']['output']>;
  /** The channel name of the shopping list */
  channelName?: Maybe<Scalars['String']['output']>;
  /** The created timestamp of the shopping list */
  createdAt?: Maybe<Scalars['Int']['output']>;
  /** Shopping list description */
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** Shopping list name */
  name?: Maybe<Scalars['String']['output']>;
  /** products of shopping list */
  products?: Maybe<BaseShoppingListItemCountableConnection>;
  /** Shopping list reason */
  reason?: Maybe<Scalars['String']['output']>;
  /** The updated timestamp of the shopping list */
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type CustomerShoppingListPageTypeProductsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type CustomerShoppingListPageTypeCountableConnection = {
  __typename?: 'CustomerShoppingListPageTypeCountableConnection';
  edges: Array<CustomerShoppingListPageTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type CustomerShoppingListPageTypeCountableEdge = {
  __typename?: 'CustomerShoppingListPageTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: CustomerShoppingListPageType;
};

export type CustomerShoppingListType = Node & {
  __typename?: 'CustomerShoppingListType';
  /** The channel id of the shopping list */
  channelId?: Maybe<Scalars['Int']['output']>;
  /** The channel name of the shopping list */
  channelName?: Maybe<Scalars['String']['output']>;
  /** The created timestamp of the shopping list */
  createdAt?: Maybe<Scalars['Int']['output']>;
  /** Shopping list description */
  description?: Maybe<Scalars['String']['output']>;
  /** grand total amount of shopping list */
  grandTotal?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** If show grand total amount of shopping list */
  isShowGrandTotal?: Maybe<Scalars['Boolean']['output']>;
  /** Shopping list name */
  name?: Maybe<Scalars['String']['output']>;
  /** products of shopping list */
  products?: Maybe<ShoppingListItemCountableConnection>;
  /** Shopping list reason */
  reason?: Maybe<Scalars['String']['output']>;
  /** Total discount of shopping list */
  totalDiscount?: Maybe<Scalars['String']['output']>;
  /** Total tax of shopping list */
  totalTax?: Maybe<Scalars['String']['output']>;
  /** The updated timestamp of the shopping list */
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type CustomerShoppingListTypeProductsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Create a shopping list.
 * Requires a BC Token.
 */
export type CustomerShoppingListsCreate = {
  __typename?: 'CustomerShoppingListsCreate';
  shoppingList?: Maybe<CustomerShoppingListType>;
};

/**
 * Delete a shopping list.
 * Requires a BC Token.
 */
export type CustomerShoppingListsDelete = {
  __typename?: 'CustomerShoppingListsDelete';
  message?: Maybe<Scalars['String']['output']>;
};

/**
 * Duplicate a shopping list.
 * Requires a BC Token.
 */
export type CustomerShoppingListsDuplicate = {
  __typename?: 'CustomerShoppingListsDuplicate';
  shoppingList?: Maybe<CustomerShoppingListType>;
};

export type CustomerShoppingListsInputType = {
  /** Filter by BC channel id. Supported in MSF stores */
  channelId?: InputMaybe<Scalars['Int']['input']>;
  /**
   * Shopping list description.
   * This field is required.
   */
  description: Scalars['String']['input'];
  /**
   * Shopping list name.
   * This field is required.
   */
  name: Scalars['String']['input'];
};

/**
 * Add items to an existed shopping list.
 * Requires a BC Token.
 */
export type CustomerShoppingListsItemsCreate = {
  __typename?: 'CustomerShoppingListsItemsCreate';
  shoppingListsItems?: Maybe<Array<Maybe<ShoppingListItem>>>;
};

/**
 * Delete shopping list item using shoppingListId and itemId.
 * Requires a BC Token.
 */
export type CustomerShoppingListsItemsDelete = {
  __typename?: 'CustomerShoppingListsItemsDelete';
  message?: Maybe<Scalars['String']['output']>;
};

/**
 * Update shopping lists items.
 * Requires a BC Token.
 */
export type CustomerShoppingListsItemsUpdate = {
  __typename?: 'CustomerShoppingListsItemsUpdate';
  shoppingListsItem?: Maybe<ShoppingListItem>;
};

/**
 * Update a shopping list.
 * Requires a BC Token.
 */
export type CustomerShoppingListsUpdate = {
  __typename?: 'CustomerShoppingListsUpdate';
  shoppingList?: Maybe<CustomerShoppingListType>;
};

export type CustomerStoreCreditAmountsInputType = {
  /**
   * The amount of the store credit.
   * This field is required
   */
  amount: Scalars['Float']['input'];
};

export type CustomerStoreCreditAmountsType = {
  __typename?: 'CustomerStoreCreditAmountsType';
  /** The amount of the store credit. */
  amount?: Maybe<Scalars['Float']['output']>;
};

export type CustomerStoreFrontTokenInputType = {
  /**
   * List of allowed domains for Cross-Origin Request Sharing.
   * This field is required
   */
  allowedCorsOrigins: Array<InputMaybe<Scalars['String']['input']>>;
  /**
   * The id of the channel.
   * This field is required
   */
  channelId: Scalars['Int']['input'];
  /**
   * The expiration time of the token.
   * This field is required
   */
  expiresAt: Scalars['Int']['input'];
  /**
   * The store hash.
   * This field is required.
   */
  storeHash: Scalars['String']['input'];
};

/** Create a new Bigcommerce customer subscriber */
export type CustomerSubscribersCreate = {
  __typename?: 'CustomerSubscribersCreate';
  customerSubscribers?: Maybe<CustomerSubscribersType>;
};

export type CustomerSubscribersInputType = {
  /** The channel ID where the subscriber was created. */
  channelId?: InputMaybe<Scalars['Int']['input']>;
  /** The email of the subscriber. Must be unique. */
  email: Scalars['String']['input'];
  /** The first name of the subscriber. */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** The last name of the subscriber. */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** The ID of the source order, if source was an order. */
  orderId?: InputMaybe<Scalars['Int']['input']>;
  /** The source of the subscriber. Values are: storefront, order, or custom. */
  source?: InputMaybe<Scalars['String']['input']>;
  /**
   * The store hash.
   * This field is required.
   */
  storeHash: Scalars['String']['input'];
};

export type CustomerSubscribersType = {
  __typename?: 'CustomerSubscribersType';
  /** The channel ID where the subscriber was created. */
  channelId?: Maybe<Scalars['Int']['output']>;
  /** Shows what active subscriptions a shopper may have. If the consents array is empty, the user has unsubscribed or didn’t enable the newsletter subscription checkbox during checkout. */
  consents?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The date the subscriber was created. */
  dateCreated?: Maybe<Scalars['String']['output']>;
  /** The date the subscriber was modified. */
  dateModified?: Maybe<Scalars['String']['output']>;
  /** The email of the subscriber. Must be unique. */
  email?: Maybe<Scalars['String']['output']>;
  /** The first name of the subscriber. */
  firstName?: Maybe<Scalars['String']['output']>;
  /** The ID of the subscriber. */
  id?: Maybe<Scalars['Int']['output']>;
  /** The last name of the subscriber. */
  lastName?: Maybe<Scalars['String']['output']>;
  /** The ID of the source order, if source was an order. */
  orderId?: Maybe<Scalars['Int']['output']>;
  /** The source of the subscriber. Values are: storefront, order, or custom. */
  source?: Maybe<Scalars['String']['output']>;
};

export type CustomerType = {
  __typename?: 'CustomerType';
  /** Determines if the customer is signed up to receive either product review or abandoned cart emails or receive both emails. */
  acceptsProductReviewAbandonedCartEmails?: Maybe<Scalars['Boolean']['output']>;
  /** Total number of customer addresses. */
  addressCount?: Maybe<Scalars['Int']['output']>;
  /** Array of customer addresses. Limited to 10. */
  addresses?: Maybe<Array<Maybe<CustomerAddressesType>>>;
  /** Total number of customer attributes. */
  attributeCount?: Maybe<Scalars['Int']['output']>;
  /** Array of customer attributes. Limited to 10 */
  attributes?: Maybe<Array<Maybe<CustomerAttributeType>>>;
  /** Customer authentication information. */
  authentication?: Maybe<CustomerAuthenticationType>;
  /** Array of channels the customer can access. */
  channelIds?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  /** The company of the customer. */
  company?: Maybe<Scalars['String']['output']>;
  /** ID of the group which this customer belongs to. */
  customerGroupId?: Maybe<Scalars['Int']['output']>;
  /** The date on which the customer was created. */
  dateCreated?: Maybe<Scalars['String']['output']>;
  /** The date on which the customer was modified. */
  dateModified?: Maybe<Scalars['String']['output']>;
  /** The email of the customer. */
  email?: Maybe<Scalars['String']['output']>;
  /** The first name of the customer. */
  firstName?: Maybe<Scalars['String']['output']>;
  /** Array of form fields. */
  formFields?: Maybe<Array<Maybe<FormFieldsType>>>;
  /** The id of the customer. */
  id?: Maybe<Scalars['Int']['output']>;
  /** The last name of the customer. */
  lastName?: Maybe<Scalars['String']['output']>;
  /** The notes of the customer. */
  notes?: Maybe<Scalars['String']['output']>;
  /** Channel ID of the customer that has created the form. */
  originChannelId?: Maybe<Scalars['Int']['output']>;
  /** The phone number of the customer. */
  phone?: Maybe<Scalars['String']['output']>;
  /** The IP address from which this customer was registered. */
  registrationIpAddress?: Maybe<Scalars['String']['output']>;
  /** Store credit. */
  storeCreditAmounts?: Maybe<Array<Maybe<CustomerStoreCreditAmountsType>>>;
  /** The tax exempt category of the customer. */
  taxExemptCategory?: Maybe<Scalars['String']['output']>;
};

export type ExtraFieldsConfigType = {
  __typename?: 'ExtraFieldsConfigType';
  /** Default value of this field. */
  defaultValue?: Maybe<Scalars['String']['output']>;
  /** Field name that config in you store */
  fieldName?: Maybe<Scalars['String']['output']>;
  /** Field type of the extra field.0 means text type. 1 means textarea type. 2 means number type. 3 means dropdown type. */
  fieldType?: Maybe<Scalars['Int']['output']>;
  /** Is this field is required */
  isRequired?: Maybe<Scalars['Boolean']['output']>;
  /** The label name of the field. */
  labelName?: Maybe<Scalars['String']['output']>;
  /** List of all optional values for the field value. fieldType == 3 */
  listOfValue?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The maximum length of the value of this field. fieldType == 0 */
  maximumLength?: Maybe<Scalars['String']['output']>;
  /** Maximum value of the field value. fieldType == 2 */
  maximumValue?: Maybe<Scalars['String']['output']>;
  /** The maximum number of rows of the value of this field. fieldType == 1 */
  numberOfRows?: Maybe<Scalars['String']['output']>;
  /** Is this field visible to end user */
  visibleToEnduser?: Maybe<Scalars['Boolean']['output']>;
};

export type ExtraFieldsValueType = {
  __typename?: 'ExtraFieldsValueType';
  /** The field name of extra field */
  fieldName?: Maybe<Scalars['String']['output']>;
  /** The field value of extra field */
  fieldValue?: Maybe<Scalars['String']['output']>;
};

/**
 * Finish invoice payment using BC order.
 * Only Admin and Super Admin can pay.
 * Requires a B2B Token.
 */
export type FinishBcPayMutation = {
  __typename?: 'FinishBcPayMutation';
  /** The invoice pay result */
  result?: Maybe<Scalars['GenericScalar']['output']>;
};

export type FormFieldsInputType = {
  /** The name of address form fields. Required */
  name: Scalars['String']['input'];
  /** The value of address form fields. Required */
  value: Scalars['GenericScalar']['input'];
};

export type FormFieldsType = {
  __typename?: 'FormFieldsType';
  /** The form field name. Required */
  name: Scalars['String']['output'];
  /** The value of address form fields. Required */
  value: Scalars['GenericScalar']['output'];
};

export type InputAccountType = {
  /**
   * company id.
   * This field is required.
   */
  companyId: Scalars['Int']['input'];
  /** Confirm password */
  confirmPassword?: InputMaybe<Scalars['String']['input']>;
  /**
   * Current password.
   * This field is required.
   */
  currentPassword: Scalars['String']['input'];
  /** User email */
  email?: InputMaybe<Scalars['String']['input']>;
  /** user extra fields */
  extraFields?: InputMaybe<Array<InputMaybe<UserExtraField>>>;
  /** User first name */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Form fields */
  formFields?: InputMaybe<Array<InputMaybe<FormFieldsInputType>>>;
  /** User last name */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** New password */
  newPassword?: InputMaybe<Scalars['String']['input']>;
  /** User phone number */
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type InputCustomerAccountType = {
  /** Company for user */
  company?: InputMaybe<Scalars['String']['input']>;
  /** Confirm password */
  confirmPassword?: InputMaybe<Scalars['String']['input']>;
  /**
   * Current password.
   * This field is required.
   */
  currentPassword: Scalars['String']['input'];
  /** User email */
  email?: InputMaybe<Scalars['String']['input']>;
  /** User first name */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** Form fields */
  formFields?: InputMaybe<Array<InputMaybe<FormFieldsInputType>>>;
  /** User last name */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** New password */
  newPassword?: InputMaybe<Scalars['String']['input']>;
  /** User phone number */
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
};

export type InvoiceBalanceType = {
  __typename?: 'InvoiceBalanceType';
  /** The code of balance */
  code?: Maybe<Scalars['String']['output']>;
  /** The value of balance */
  value?: Maybe<Scalars['String']['output']>;
};

export type InvoiceCustomerInformationType = {
  __typename?: 'InvoiceCustomerInformationType';
  /** The ID of company. */
  companyId?: Maybe<Scalars['String']['output']>;
  /** The name of company. */
  companyName?: Maybe<Scalars['String']['output']>;
  /** The ID of payer. */
  payerId?: Maybe<Scalars['String']['output']>;
  /** The username of payer. */
  payerName?: Maybe<Scalars['String']['output']>;
};

export type InvoiceExtraFieldsType = {
  __typename?: 'InvoiceExtraFieldsType';
  /** The field name of extra field */
  fieldName?: Maybe<Scalars['String']['output']>;
  /** The field value of extra field */
  fieldValue?: Maybe<Scalars['String']['output']>;
};

export type InvoiceFilterDataType = {
  /** Create date timestamp begin at */
  beginDateAt?: InputMaybe<Scalars['Int']['input']>;
  /** Create date timestamp end at */
  endDateAt?: InputMaybe<Scalars['Int']['input']>;
  /** The invoice id list */
  idIn?: InputMaybe<Scalars['String']['input']>;
  /** The invoice number of the invoice */
  invoiceNumber?: InputMaybe<Scalars['String']['input']>;
  /** order by */
  orderBy?: InputMaybe<Scalars['String']['input']>;
  /** The order number of the invoice */
  orderNumber?: InputMaybe<Scalars['String']['input']>;
  /** query */
  search?: InputMaybe<Scalars['String']['input']>;
  /** The status of the invoice */
  status?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
};

export type InvoiceLineItemsInputType = {
  /**
   * The amount of invoice you want to pay.
   * This field is required
   */
  amount: Scalars['String']['input'];
  /**
   * The id of invoice.
   * This field is required
   */
  invoiceId: Scalars['Int']['input'];
};

export type InvoicePaymentType = Node & {
  __typename?: 'InvoicePaymentType';
  appliedStatus: Scalars['Int']['output'];
  /** The B2B Edition channel id */
  channelId?: Maybe<Scalars['Int']['output']>;
  /** The channel name */
  channelName?: Maybe<Scalars['String']['output']>;
  /** The id of company */
  companyId?: Maybe<Scalars['String']['output']>;
  /** The name of company */
  companyName?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Int']['output'];
  customerBcGroupName?: Maybe<Scalars['String']['output']>;
  customerBcId?: Maybe<Scalars['Int']['output']>;
  /** The BC customer group id */
  customerGroupId?: Maybe<Scalars['String']['output']>;
  customerName?: Maybe<Scalars['String']['output']>;
  /** The invoice payment details */
  details?: Maybe<Scalars['GenericScalar']['output']>;
  externalCustomerId?: Maybe<Scalars['String']['output']>;
  externalId?: Maybe<Scalars['String']['output']>;
  /** The invoice payment fees */
  fees?: Maybe<Scalars['GenericScalar']['output']>;
  fundingStatus: Scalars['Int']['output'];
  id: Scalars['ID']['output'];
  /** The invoice payment module data */
  moduleData?: Maybe<Scalars['GenericScalar']['output']>;
  moduleName: Scalars['String']['output'];
  payerCustomerId?: Maybe<Scalars['String']['output']>;
  payerName?: Maybe<Scalars['String']['output']>;
  paymentReceiptSet: ReceiptTypeCountableConnection;
  processingStatus: Scalars['Int']['output'];
  totalAmount?: Maybe<Scalars['Decimal']['output']>;
  totalCode?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Int']['output'];
};

export type InvoicePaymentTypePaymentReceiptSetArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type InvoicePaymentTypeCountableConnection = {
  __typename?: 'InvoicePaymentTypeCountableConnection';
  edges: Array<InvoicePaymentTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type InvoicePaymentTypeCountableEdge = {
  __typename?: 'InvoicePaymentTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: InvoicePaymentType;
};

export type InvoiceStatsType = {
  __typename?: 'InvoiceStatsType';
  /** Has due invoice? */
  hasDueInvoice?: Maybe<Scalars['Boolean']['output']>;
  /** Has over due invoice? */
  hasOverDueInvoice?: Maybe<Scalars['Boolean']['output']>;
  /** Amount not paid when the invoice is due. */
  overDueBalance?: Maybe<Scalars['Float']['output']>;
  /** The total balance of invoice. */
  totalBalance?: Maybe<Scalars['Float']['output']>;
};

export type InvoiceStoreInfoType = {
  __typename?: 'InvoiceStoreInfoType';
  /** BC store display address */
  address?: Maybe<Scalars['String']['output']>;
  /** Email address of the store administrator/owner */
  adminEmail?: Maybe<Scalars['String']['output']>;
  /** Country where the store is located */
  country?: Maybe<Scalars['String']['output']>;
  /** Country code where the store is located */
  countryCode?: Maybe<Scalars['String']['output']>;
  /** BC store primary contact’s first name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** BC store primary contact’s last name */
  lastName?: Maybe<Scalars['String']['output']>;
  /** BC store name */
  name?: Maybe<Scalars['String']['output']>;
  /** BC store display phone number */
  phone?: Maybe<Scalars['String']['output']>;
};

export type InvoiceType = Node & {
  __typename?: 'InvoiceType';
  /** The information of the invoice */
  bcInformation?: Maybe<BcInfomation>;
  /** The channel id of the invoice */
  channelId?: Maybe<Scalars['Int']['output']>;
  /** The channel name of the invoice */
  channelName?: Maybe<Scalars['String']['output']>;
  /** The created timestamp of the invoice */
  createdAt?: Maybe<Scalars['Int']['output']>;
  /** The customer id of the invoice */
  customerId?: Maybe<Scalars['String']['output']>;
  /** The details of the invoice */
  details?: Maybe<Scalars['GenericScalar']['output']>;
  /** The due date of the invoice */
  dueDate?: Maybe<Scalars['Int']['output']>;
  /** The external customer id of the invoice */
  externalCustomerId?: Maybe<Scalars['String']['output']>;
  /** The external id of the invoice */
  externalId?: Maybe<Scalars['String']['output']>;
  /** The extra fields of the invoice */
  extraFields?: Maybe<Array<Maybe<InvoiceExtraFieldsType>>>;
  id: Scalars['ID']['output'];
  /** The invoice number of the invoice */
  invoiceNumber?: Maybe<Scalars['String']['output']>;
  /** Can this invoice allow payment */
  notAllowedPay?: Maybe<Scalars['Int']['output']>;
  /** The open balance of the invoice */
  openBalance?: Maybe<InvoiceBalanceType>;
  /** The order number of the invoice */
  orderNumber?: Maybe<Scalars['String']['output']>;
  /** The original balance of the invoice */
  originalBalance?: Maybe<InvoiceBalanceType>;
  /** The pending payment count of the invoice */
  pendingPaymentCount?: Maybe<Scalars['Int']['output']>;
  /** The purchase order number of the invoice */
  purchaseOrderNumber?: Maybe<Scalars['String']['output']>;
  /** The source of the invoice */
  source?: Maybe<Scalars['Int']['output']>;
  /** The status of the invoice. (0: open, 1: partial paid, 2: completed) */
  status?: Maybe<Scalars['Int']['output']>;
  /** The store's store hash */
  storeHash?: Maybe<Scalars['String']['output']>;
  /** The store information */
  storeInfo?: Maybe<InvoiceStoreInfoType>;
  /** The time offset */
  timeOffset?: Maybe<Scalars['Int']['output']>;
  /** The type of the invoice */
  type?: Maybe<Scalars['String']['output']>;
  /** The updated timestamp of the invoice */
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type InvoiceTypeCountableConnection = {
  __typename?: 'InvoiceTypeCountableConnection';
  edges: Array<InvoiceTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type InvoiceTypeCountableEdge = {
  __typename?: 'InvoiceTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: InvoiceType;
};

export type Mutation = {
  __typename?: 'Mutation';
  /**
   * Create a company address.
   * Requires a B2B Token.
   */
  addressCreate?: Maybe<AddressCreate>;
  /**
   * Delete a company address.
   * Requires a B2B Token.
   */
  addressDelete?: Maybe<AddressDelete>;
  /**
   * Update a company address.
   * Requires a B2B Token.
   */
  addressUpdate?: Maybe<AddressUpdate>;
  /** Authorize using a Bigcommerce token. */
  authorization?: Maybe<UserAuthorization>;
  /**
   * Login to checkout for a given cart.
   * Requires a B2B token.
   */
  checkoutLogin?: Maybe<UserCheckoutLogin>;
  /** Create a company using a customer id. */
  companyCreate?: Maybe<CompanyCreate>;
  /**
   * Create an order in the BigCommerce store.
   * Requires a B2B Token.
   */
  createOrder?: Maybe<OrderCreate>;
  /**
   * Create a customer address.
   * Requires a BC Token.
   */
  customerAddressCreate?: Maybe<CustomerAddressCreate>;
  /**
   * Delete a customer address.
   * Requires a BC Token.
   */
  customerAddressDelete?: Maybe<CustomerAddressDelete>;
  /**
   * Update a customer address.
   * Requires a BC Token.
   */
  customerAddressUpdate?: Maybe<CustomerAddressUpdate>;
  /** Create a new Bigcommerce customer */
  customerCreate?: Maybe<CustomerCreate>;
  /**
   * Create a shopping list.
   * Requires a BC Token.
   */
  customerShoppingListsCreate?: Maybe<CustomerShoppingListsCreate>;
  /**
   * Delete a shopping list.
   * Requires a BC Token.
   */
  customerShoppingListsDelete?: Maybe<CustomerShoppingListsDelete>;
  /**
   * Duplicate a shopping list.
   * Requires a BC Token.
   */
  customerShoppingListsDuplicate?: Maybe<CustomerShoppingListsDuplicate>;
  /**
   * Add items to an existed shopping list.
   * Requires a BC Token.
   */
  customerShoppingListsItemsCreate?: Maybe<CustomerShoppingListsItemsCreate>;
  /**
   * Delete shopping list item using shoppingListId and itemId.
   * Requires a BC Token.
   */
  customerShoppingListsItemsDelete?: Maybe<CustomerShoppingListsItemsDelete>;
  /**
   * Update shopping lists items.
   * Requires a BC Token.
   */
  customerShoppingListsItemsUpdate?: Maybe<CustomerShoppingListsItemsUpdate>;
  /**
   * Update a shopping list.
   * Requires a BC Token.
   */
  customerShoppingListsUpdate?: Maybe<CustomerShoppingListsUpdate>;
  /** Create a new Bigcommerce customer subscriber */
  customerSubscribersCreate?: Maybe<CustomerSubscribersCreate>;
  /**
   * Create a BC cart for invoice payment.
   * Only Admin and Super Admin can create cart.
   * Requires a B2B Token.
   */
  invoiceCreateBcCart?: Maybe<CreateBcCartMutation>;
  /**
   * Finish invoice payment using BC order.
   * Only Admin and Super Admin can pay.
   * Requires a B2B Token.
   */
  invoiceFinishBcPayment?: Maybe<FinishBcPayMutation>;
  /**
   * Download invoice pdf file by invoice id.
   * Requires a B2B Token.
   */
  invoicePdf?: Maybe<InvoicePdf>;
  /**
   * Export invoice csv file.
   * Requires a B2B Token.
   */
  invoicesExport?: Maybe<InvoicesExport>;
  /**
   * Login to a store with Bigcommerce user email and password.
   * Doesn't require a Token.
   */
  login?: Maybe<UserLogin>;
  /**
   * CSV Upload for anon
   * Doesn't require a Token.
   */
  productAnonUpload?: Maybe<ProductsAnonUpload>;
  /**
   * CSV Upload.
   * Requires either a B2B or BC Token.
   */
  productUpload?: Maybe<ProductsUpload>;
  /**
   * Create attachment for a quote.
   * Requires either B2B or BC Token.
   */
  quoteAttachFileCreate?: Maybe<QuoteAttachmentCreate>;
  /**
   * Delete Attachment from a quote.
   * Requires either B2B or BC Token.
   */
  quoteAttachFileDelete?: Maybe<QuoteAttachmentDelete>;
  /**
   * Get the checkout information for a quote.
   * Doesn't require a Token.
   */
  quoteCheckout?: Maybe<QuoteCheckout>;
  /**
   * Create a new quote.
   * Requires B2B or BC token only if store has disabled guest quotes
   */
  quoteCreate?: Maybe<QuoteCreate>;
  /**
   * Send a Quote Email.
   * Requires either B2B or BC Token.
   */
  quoteEmail?: Maybe<QuoteEmail>;
  /** Export a quote PDF. */
  quoteFrontendPdf?: Maybe<QuoteFrontendPdf>;
  /**
   * Ordered a quote.
   * Requires either B2B or BC Token.
   */
  quoteOrdered?: Maybe<QuoteOrdered>;
  /**
   * This API is deprecated, please use QuoteFrontendPdf. Export a quote to PDF.
   * Requires either B2B or BC Token.
   */
  quotePdfExport?: Maybe<QuotePdfExport>;
  /**
   * Update a Quote.
   * Requires either B2B or BC Token.
   */
  quoteUpdate?: Maybe<QuoteUpdate>;
  /**
   * Create a shopping list.
   * Requires a B2B Token.
   */
  shoppingListsCreate?: Maybe<ShoppingListsCreate>;
  /**
   * Delete a shopping list.
   * Requires a B2B Token.
   */
  shoppingListsDelete?: Maybe<ShoppingListsDelete>;
  /**
   * Duplicate a shopping list.
   * Requires a B2B Token.
   */
  shoppingListsDuplicate?: Maybe<ShoppingListsDuplicate>;
  /**
   * Add items to an existed shopping list.
   * Requires a B2B Token.
   */
  shoppingListsItemsCreate?: Maybe<ShoppingListsItemsCreate>;
  /**
   * Delete shopping list item using shoppingListId and itemId.
   * Requires a B2B Token.
   */
  shoppingListsItemsDelete?: Maybe<ShoppingListsItemsDelete>;
  /**
   * Update shopping lists items.
   * Requires a B2B Token.
   */
  shoppingListsItemsUpdate?: Maybe<ShoppingListsItemsUpdate>;
  /**
   * Update a shopping list.
   * Requires a B2B Token.
   */
  shoppingListsUpdate?: Maybe<ShoppingListsUpdate>;
  /**
   * Creates a Storefront API token.
   * Doesn't require a Token.
   */
  storeFrontToken?: Maybe<UserStoreFrontToken>;
  /**
   * Begin a masquerade using a super admin user.
   * Requires a B2B Token.
   */
  superAdminBeginMasquerade?: Maybe<SuperAdminBeginMasquerade>;
  /**
   * End a masquerade using a super admin user.
   * Requires a B2B Token.
   */
  superAdminEndMasquerade?: Maybe<SuperAdminEndMasquerade>;
  /**
   * Update Account Settings.
   * Requires a B2B Token.
   */
  updateAccountSettings?: Maybe<UpdateAccount>;
  /**
   * Update Customer Account Settings.
   * Requires a BC Token.
   */
  updateCustomerAccountSettings?: Maybe<UpdateCustomerAccount>;
  /**
   * Create a company user.
   * Requires a B2B Token.
   */
  userCreate?: Maybe<UserCreate>;
  /**
   * Delete a company user.
   * Requires a B2B Token.
   */
  userDelete?: Maybe<UserDelete>;
  /**
   * Update a company user.
   * Requires a B2B Token.
   */
  userUpdate?: Maybe<UserUpdate>;
};

export type MutationAddressCreateArgs = {
  addressData: AddressInputType;
};

export type MutationAddressDeleteArgs = {
  addressId: Scalars['Int']['input'];
  companyId: Scalars['Int']['input'];
};

export type MutationAddressUpdateArgs = {
  addressData: AddressUpdateType;
};

export type MutationAuthorizationArgs = {
  authData: UserAuthType;
};

export type MutationCheckoutLoginArgs = {
  cartData: CheckoutLoginType;
};

export type MutationCompanyCreateArgs = {
  companyData?: InputMaybe<CompanyInputType>;
};

export type MutationCreateOrderArgs = {
  createData: OrderCreateInputType;
};

export type MutationCustomerAddressCreateArgs = {
  addressData: CustomerAddressInputType;
};

export type MutationCustomerAddressDeleteArgs = {
  bcAddressId: Scalars['Int']['input'];
};

export type MutationCustomerAddressUpdateArgs = {
  addressData: CustomerAddressUpdateType;
};

export type MutationCustomerCreateArgs = {
  customerData: CustomerInputType;
};

export type MutationCustomerShoppingListsCreateArgs = {
  shoppingListData: CustomerShoppingListsInputType;
};

export type MutationCustomerShoppingListsDeleteArgs = {
  id: Scalars['Int']['input'];
};

export type MutationCustomerShoppingListsDuplicateArgs = {
  sampleShoppingListId: Scalars['Int']['input'];
  shoppingListData: ShoppingListsDuplicateInputType;
};

export type MutationCustomerShoppingListsItemsCreateArgs = {
  items?: InputMaybe<Array<InputMaybe<ShoppingListsItemsInputType>>>;
  shoppingListId?: InputMaybe<Scalars['Int']['input']>;
};

export type MutationCustomerShoppingListsItemsDeleteArgs = {
  itemId: Scalars['Int']['input'];
  shoppingListId: Scalars['Int']['input'];
};

export type MutationCustomerShoppingListsItemsUpdateArgs = {
  itemData: ShoppingListsItemsUpdateInputType;
  itemId: Scalars['Int']['input'];
  shoppingListId: Scalars['Int']['input'];
};

export type MutationCustomerShoppingListsUpdateArgs = {
  id: Scalars['Int']['input'];
  shoppingListData: CustomerShoppingListsInputType;
};

export type MutationCustomerSubscribersCreateArgs = {
  subscribersData: CustomerSubscribersInputType;
};

export type MutationInvoiceCreateBcCartArgs = {
  bcCartData: BcCartInputType;
};

export type MutationInvoiceFinishBcPaymentArgs = {
  comment?: InputMaybe<Scalars['String']['input']>;
  orderId: Scalars['Int']['input'];
};

export type MutationInvoicePdfArgs = {
  invoiceId: Scalars['Int']['input'];
  isPayNow?: InputMaybe<Scalars['Boolean']['input']>;
};

export type MutationInvoicesExportArgs = {
  invoiceFilterData?: InputMaybe<InvoiceFilterDataType>;
  lang?: InputMaybe<Scalars['String']['input']>;
};

export type MutationLoginArgs = {
  loginData: UserLoginType;
};

export type MutationProductAnonUploadArgs = {
  productListData?: InputMaybe<ProductAnonUploadInputType>;
};

export type MutationProductUploadArgs = {
  productListData: ProductUploadInputType;
};

export type MutationQuoteAttachFileCreateArgs = {
  fileList?: InputMaybe<Array<InputMaybe<QuoteFileListInputType>>>;
  quoteId: Scalars['Int']['input'];
};

export type MutationQuoteAttachFileDeleteArgs = {
  fileId: Scalars['Int']['input'];
  quoteId: Scalars['Int']['input'];
};

export type MutationQuoteCheckoutArgs = {
  id: Scalars['Int']['input'];
  storeHash: Scalars['String']['input'];
};

export type MutationQuoteCreateArgs = {
  quoteData: QuoteInputType;
};

export type MutationQuoteEmailArgs = {
  emailData: QuoteEmailInputType;
};

export type MutationQuoteFrontendPdfArgs = {
  createdAt: Scalars['Int']['input'];
  isPreview?: InputMaybe<Scalars['Boolean']['input']>;
  lang: Scalars['String']['input'];
  quoteId: Scalars['Int']['input'];
  storeHash: Scalars['String']['input'];
};

export type MutationQuoteOrderedArgs = {
  id: Scalars['Int']['input'];
  orderedData: QuoteOrderedInputType;
};

export type MutationQuotePdfExportArgs = {
  currency: QuoteCurrencyInputType;
  quoteId: Scalars['Int']['input'];
  storeHash: Scalars['String']['input'];
};

export type MutationQuoteUpdateArgs = {
  id: Scalars['Int']['input'];
  quoteData: QuoteUpdateInputType;
};

export type MutationShoppingListsCreateArgs = {
  shoppingListData: ShoppingListsInputType;
};

export type MutationShoppingListsDeleteArgs = {
  id: Scalars['Int']['input'];
};

export type MutationShoppingListsDuplicateArgs = {
  sampleShoppingListId: Scalars['Int']['input'];
  shoppingListData: ShoppingListsDuplicateInputType;
};

export type MutationShoppingListsItemsCreateArgs = {
  items: Array<InputMaybe<ShoppingListsItemsInputType>>;
  shoppingListId: Scalars['Int']['input'];
};

export type MutationShoppingListsItemsDeleteArgs = {
  itemId: Scalars['Int']['input'];
  shoppingListId: Scalars['Int']['input'];
};

export type MutationShoppingListsItemsUpdateArgs = {
  itemData: ShoppingListsItemsUpdateInputType;
  itemId: Scalars['Int']['input'];
  shoppingListId: Scalars['Int']['input'];
};

export type MutationShoppingListsUpdateArgs = {
  id?: InputMaybe<Scalars['Int']['input']>;
  shoppingListData?: InputMaybe<ShoppingListsInputType>;
};

export type MutationStoreFrontTokenArgs = {
  storeFrontTokenData: CustomerStoreFrontTokenInputType;
};

export type MutationSuperAdminBeginMasqueradeArgs = {
  companyId: Scalars['Int']['input'];
};

export type MutationSuperAdminEndMasqueradeArgs = {
  companyId: Scalars['Int']['input'];
};

export type MutationUpdateAccountSettingsArgs = {
  updateData: InputAccountType;
};

export type MutationUpdateCustomerAccountSettingsArgs = {
  updateData?: InputMaybe<InputCustomerAccountType>;
};

export type MutationUserCreateArgs = {
  userData: UserInputType;
};

export type MutationUserDeleteArgs = {
  companyId: Scalars['Int']['input'];
  userId: Scalars['Int']['input'];
};

export type MutationUserUpdateArgs = {
  userData: UserUpdateInputType;
};

/** An object with an ID */
export type Node = {
  /** The ID of the object */
  id: Scalars['ID']['output'];
};

/**
 * Create an order in the BigCommerce store.
 * Requires a B2B Token.
 */
export type OrderCreate = {
  __typename?: 'OrderCreate';
  orderId?: Maybe<Scalars['Int']['output']>;
};

export type OrderCreateInputType = {
  /** Unique order ID in BigCommerce store */
  bcOrderId: Scalars['Int']['input'];
  /** Order extra fields */
  extraFields?: InputMaybe<Scalars['GenericScalar']['input']>;
  /** Order extra info */
  extraInfo?: InputMaybe<Scalars['String']['input']>;
  /** Order extra int field 1 */
  extraInt1?: InputMaybe<Scalars['Int']['input']>;
  /** Order extra int field 2 */
  extraInt2?: InputMaybe<Scalars['Int']['input']>;
  /** Order extra int field 3 */
  extraInt3?: InputMaybe<Scalars['Int']['input']>;
  /** Order extra int field 4 */
  extraInt4?: InputMaybe<Scalars['Int']['input']>;
  /** Order extra int field 5 */
  extraInt5?: InputMaybe<Scalars['Int']['input']>;
  /** Order extra str field 1 */
  extraStr1?: InputMaybe<Scalars['String']['input']>;
  /** Order extra str field 2 */
  extraStr2?: InputMaybe<Scalars['String']['input']>;
  /** Order extra str field 3 */
  extraStr3?: InputMaybe<Scalars['String']['input']>;
  /** Order extra str field 4 */
  extraStr4?: InputMaybe<Scalars['String']['input']>;
  /** Order extra str field 5 */
  extraStr5?: InputMaybe<Scalars['String']['input']>;
  /** Order extra text */
  extraText?: InputMaybe<Scalars['String']['input']>;
  /** If save order comment, default value is 1 */
  isSaveOrderComment?: InputMaybe<Scalars['String']['input']>;
  /** PO number */
  poNumber?: InputMaybe<Scalars['String']['input']>;
  /** Reference number */
  referenceNumber?: InputMaybe<Scalars['String']['input']>;
};

export type OrderHistoryEventType = {
  __typename?: 'OrderHistoryEventType';
  /** The creation timestamp of this event */
  createdAt?: Maybe<Scalars['Int']['output']>;
  /** event type */
  eventType?: Maybe<Scalars['Int']['output']>;
  /** event extra fields */
  extraFields?: Maybe<Scalars['GenericScalar']['output']>;
  /** event id */
  id?: Maybe<Scalars['Int']['output']>;
  /** order status */
  status?: Maybe<Scalars['String']['output']>;
};

export type OrderImageType = {
  __typename?: 'OrderImageType';
  /** Image url address */
  imageUrl?: Maybe<Scalars['String']['output']>;
  /** BC Order id */
  orderId?: Maybe<Scalars['String']['output']>;
};

export type OrderProductType = {
  __typename?: 'OrderProductType';
  /** Product notes */
  notes?: Maybe<Scalars['String']['output']>;
  /** Product option list */
  optionList?: Maybe<Scalars['GenericScalar']['output']>;
  /** Unique order product ID */
  productId?: Maybe<Scalars['String']['output']>;
  /** Product quantity in this order */
  quantity?: Maybe<Scalars['String']['output']>;
  /** Unique variant ID */
  variantId?: Maybe<Scalars['String']['output']>;
};

export type OrderStatusType = {
  __typename?: 'OrderStatusType';
  /** The custom label of order status.Required */
  customLabel?: Maybe<Scalars['String']['output']>;
  /** The status code of order status.Required */
  statusCode?: Maybe<Scalars['String']['output']>;
  /** The system label of order status.Required */
  systemLabel?: Maybe<Scalars['String']['output']>;
};

export type OrderType = Node & {
  __typename?: 'OrderType';
  bcCustomerId?: Maybe<Scalars['Int']['output']>;
  bcOrderId: Scalars['Int']['output'];
  bcOrderInfos: Scalars['JSONString']['output'];
  billingName?: Maybe<Scalars['String']['output']>;
  cartId?: Maybe<Scalars['String']['output']>;
  /** The B2B Edition channel id */
  channelId?: Maybe<Scalars['Int']['output']>;
  /** The channel name */
  channelName?: Maybe<Scalars['String']['output']>;
  companyId?: Maybe<CompanyType>;
  /** order's company name */
  companyName?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Int']['output'];
  createdFrom?: Maybe<OrdersOrdersCreatedFromChoices>;
  currencyCode?: Maybe<Scalars['String']['output']>;
  customOrderStatus?: Maybe<Scalars['String']['output']>;
  customStatus?: Maybe<Scalars['String']['output']>;
  customer: Scalars['JSONString']['output'];
  extraInfo?: Maybe<Scalars['JSONString']['output']>;
  extraInt1?: Maybe<Scalars['Int']['output']>;
  extraInt2?: Maybe<Scalars['Int']['output']>;
  extraInt3?: Maybe<Scalars['Int']['output']>;
  extraInt4?: Maybe<Scalars['Int']['output']>;
  extraInt5?: Maybe<Scalars['Int']['output']>;
  extraStr1?: Maybe<Scalars['String']['output']>;
  extraStr2?: Maybe<Scalars['String']['output']>;
  extraStr3?: Maybe<Scalars['String']['output']>;
  extraStr4?: Maybe<Scalars['String']['output']>;
  extraStr5?: Maybe<Scalars['String']['output']>;
  extraText?: Maybe<Scalars['JSONString']['output']>;
  /** order owner's first name */
  firstName?: Maybe<Scalars['String']['output']>;
  flag?: Maybe<OrdersOrdersFlagChoices>;
  id: Scalars['ID']['output'];
  invoiceId?: Maybe<Scalars['String']['output']>;
  invoiceNumber?: Maybe<Scalars['String']['output']>;
  invoiceStatus?: Maybe<Scalars['String']['output']>;
  ipStatus?: Maybe<OrdersOrdersIpStatusChoices>;
  isArchived?: Maybe<Scalars['Boolean']['output']>;
  isInvoiceOrder: OrdersOrdersIsInvoiceOrderChoices;
  items?: Maybe<Scalars['Int']['output']>;
  /** order owner's last name */
  lastName?: Maybe<Scalars['String']['output']>;
  merchantEmail?: Maybe<Scalars['String']['output']>;
  money?: Maybe<Scalars['JSONString']['output']>;
  /** Order bc id */
  orderId?: Maybe<Scalars['String']['output']>;
  /** order status */
  orderStatus?: Maybe<Scalars['String']['output']>;
  poNumber?: Maybe<Scalars['String']['output']>;
  products: Scalars['JSONString']['output'];
  referenceNumber?: Maybe<Scalars['String']['output']>;
  shipments: Scalars['JSONString']['output'];
  shippingAddress: Scalars['JSONString']['output'];
  status: Scalars['String']['output'];
  statusCode: Scalars['Int']['output'];
  totalIncTax?: Maybe<Scalars['Float']['output']>;
  updatedAt: Scalars['Int']['output'];
  usdIncTax?: Maybe<Scalars['Float']['output']>;
  userId: Scalars['Int']['output'];
};

export type OrderTypeCountableConnection = {
  __typename?: 'OrderTypeCountableConnection';
  edges: Array<OrderTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type OrderTypeCountableEdge = {
  __typename?: 'OrderTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: OrderType;
};

export type OrderedProductType = Node & {
  __typename?: 'OrderedProductType';
  /** Product base price */
  basePrice?: Maybe<Scalars['String']['output']>;
  /** Product base SKU */
  baseSku?: Maybe<Scalars['String']['output']>;
  /** The B2B Edition channel id */
  channelId?: Maybe<Scalars['Int']['output']>;
  /** The channel name */
  channelName?: Maybe<Scalars['String']['output']>;
  companyId?: Maybe<CompanyType>;
  createdAt: Scalars['Int']['output'];
  /** Product discount */
  discount?: Maybe<Scalars['String']['output']>;
  /** Product entered inclusive */
  enteredInclusive?: Maybe<Scalars['Boolean']['output']>;
  firstOrderedAt: Scalars['Int']['output'];
  /** The ID of the object */
  id: Scalars['ID']['output'];
  /** Image url of product */
  imageUrl?: Maybe<Scalars['String']['output']>;
  /** product last ordered timestamp */
  lastOrdered: Scalars['String']['output'];
  lastOrderedAt: Scalars['Int']['output'];
  /** Items count when last ordered */
  lastOrderedItems: Scalars['String']['output'];
  /** product option list */
  optionList?: Maybe<Scalars['GenericScalar']['output']>;
  /** option selections */
  optionSelections?: Maybe<Scalars['GenericScalar']['output']>;
  /** product id */
  orderProductId: Scalars['String']['output'];
  /** product ordered times */
  orderedTimes: Scalars['String']['output'];
  /** orders info */
  ordersInfo?: Maybe<Scalars['GenericScalar']['output']>;
  /** product brand name */
  productBrandName?: Maybe<Scalars['String']['output']>;
  /** product id */
  productId: Scalars['String']['output'];
  /** product name */
  productName: Scalars['String']['output'];
  /** Product url */
  productUrl?: Maybe<Scalars['String']['output']>;
  /** product sku */
  sku: Scalars['String']['output'];
  /** Product tax */
  tax?: Maybe<Scalars['String']['output']>;
  updatedAt: Scalars['Int']['output'];
  /** product variant id */
  variantId: Scalars['String']['output'];
  variantSku?: Maybe<Scalars['String']['output']>;
};

export type OrderedProductTypeCountableConnection = {
  __typename?: 'OrderedProductTypeCountableConnection';
  edges: Array<OrderedProductTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type OrderedProductTypeCountableEdge = {
  __typename?: 'OrderedProductTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: OrderedProductType;
};

/** An enumeration. */
export enum OrdersOrdersCreatedFromChoices {
  /** B2B */
  A_0 = 'A_0',
  /** Webhook */
  A_1 = 'A_1',
  /** IO */
  A_2 = 'A_2',
  /** Buyer portal sync */
  A_3 = 'A_3',
  /** Webhook to B2B */
  A_4 = 'A_4',
}

/** An enumeration. */
export enum OrdersOrdersFlagChoices {
  /** Created */
  A_0 = 'A_0',
  /** Edited */
  A_1 = 'A_1',
  /** Canceled */
  A_2 = 'A_2',
  /** Edit checked */
  A_3 = 'A_3',
}

/** An enumeration. */
export enum OrdersOrdersIpStatusChoices {
  /** Open */
  A_0 = 'A_0',
  /** Invoiced */
  A_1 = 'A_1',
  /** Completed */
  A_2 = 'A_2',
}

/** An enumeration. */
export enum OrdersOrdersIsInvoiceOrderChoices {
  /** N */
  A_0 = 'A_0',
  /** Y */
  A_1 = 'A_1',
}

/** The Relay compliant `PageInfo` type, containing data necessary to paginate this connection. */
export type PageInfo = {
  __typename?: 'PageInfo';
  /** When paginating forwards, the cursor to continue. */
  endCursor?: Maybe<Scalars['String']['output']>;
  /** When paginating forwards, are there more items? */
  hasNextPage: Scalars['Boolean']['output'];
  /** When paginating backwards, are there more items? */
  hasPreviousPage: Scalars['Boolean']['output'];
  /** When paginating backwards, the cursor to continue. */
  startCursor?: Maybe<Scalars['String']['output']>;
};

export type PaymentBcCartType = {
  __typename?: 'PaymentBcCartType';
  /** The BC cart id */
  cartId?: Maybe<Scalars['String']['output']>;
  /** The BC checkout url */
  checkoutUrl?: Maybe<Scalars['String']['output']>;
};

export type PaymentFeesType = {
  __typename?: 'PaymentFeesType';
  /** The payment fees */
  paymentFees?: Maybe<Scalars['GenericScalar']['output']>;
};

export type PaymentModuleType = {
  __typename?: 'PaymentModuleType';
  /** The payment module name */
  moduleName?: Maybe<Scalars['String']['output']>;
  /** The payment module value */
  value?: Maybe<Scalars['GenericScalar']['output']>;
};

export type PaymentRelatedCartType = {
  __typename?: 'PaymentRelatedCartType';
  /** The BC cart id */
  cartId?: Maybe<Scalars['String']['output']>;
  /** The BC cart url */
  cartUrl?: Maybe<Scalars['String']['output']>;
};

export type PriceDisplaySettingsType = {
  __typename?: 'PriceDisplaySettingsType';
  /** show prices as tax inclusive matched with this tax zone */
  showBothOnDetailView?: Maybe<Scalars['Boolean']['output']>;
  /** show prices as tax inclusive matched with this tax zone */
  showBothOnListView?: Maybe<Scalars['Boolean']['output']>;
  /** show prices as tax inclusive to shoppers matched with this tax zone */
  showInclusive?: Maybe<Scalars['Boolean']['output']>;
};

export type PriceRangeType = {
  __typename?: 'PriceRangeType';
  /** The price for a product, including estimates for tax. */
  maximum?: Maybe<PriceType>;
  /** The price for a product, including estimates for tax. */
  minimum?: Maybe<PriceType>;
};

export type PriceType = {
  __typename?: 'PriceType';
  /** The price provided by the merchant, as entered in their catalog/price list; may include or exclude tax. */
  asEntered?: Maybe<Scalars['Float']['output']>;
  /** Determines whether the as_entered price is inclusive or exclusive of tax, based on the store's tax jurisdiction. */
  enteredInclusive?: Maybe<Scalars['Boolean']['output']>;
  /** The estimated tax-exclusive price for this product based on the provided customer group. */
  taxExclusive?: Maybe<Scalars['Float']['output']>;
  /** The estimated tax-inclusive price for this product based on the provided customer group. */
  taxInclusive?: Maybe<Scalars['Float']['output']>;
};

export type PricingProductItemInputType = {
  /** The option configuration of the product (optional); might be partially configured for estimates. */
  options?: InputMaybe<Array<InputMaybe<PricingProductItemOptionsInputType>>>;
  /** The (required) product ID of the item. */
  productId: Scalars['Int']['input'];
  /** The (optional) variant ID of the item. */
  variantId?: InputMaybe<Scalars['Int']['input']>;
};

export type PricingProductItemOptionsInputType = {
  /** The ID of the variant option or modifier option that is being configured for this product. */
  optionId?: InputMaybe<Scalars['Int']['input']>;
  /** The ID of the value matching the option that's being configured. */
  valueId?: InputMaybe<Scalars['Int']['input']>;
};

export type PricingProductItemOptionsType = {
  __typename?: 'PricingProductItemOptionsType';
  /** The ID of the variant option or modifier option that is being configured for this product. */
  optionId?: Maybe<Scalars['Int']['output']>;
  /** The ID of the value matching the option that's being configured. */
  valueId?: Maybe<Scalars['Int']['output']>;
};

export type PricingProductType = {
  __typename?: 'PricingProductType';
  /** The bulk pricing rules that apply to this product. */
  bulkPricing?: Maybe<Array<Maybe<BulkPricingType>>>;
  /** The shopper price for a product, which includes modifier, option, and option set rules. The calculated_price may include or exclude estimates for tax. */
  calculatedPrice?: Maybe<PriceType>;
  /** The minimum advertised price (MAP) you can display on a storefront. A value supplied by the merchant and used for display purposes. */
  minimumAdvertisedPrice?: Maybe<PriceType>;
  /** The optional product option configuration for this generated price. */
  options?: Maybe<Array<Maybe<PricingProductItemOptionsType>>>;
  /** The merchant-entered price for a product, which could include or exclude tax. When creating a product, you must define the price, which serves as the default price. */
  price?: Maybe<PriceType>;
  /** The minimum and maximum price that will typically apply to this product. Only used for complex products (products with variants). */
  priceRange?: Maybe<PriceRangeType>;
  /** The product ID of the item. */
  productId?: Maybe<Scalars['Int']['output']>;
  /** You can use the original details of the request to identify the exact product variant and fetch prices. */
  referenceRequest?: Maybe<ReferenceRequestType>;
  /** The (optional) RRP/retail price configured for this product and used for price comparison and storefront display purposes. */
  retailPrice?: Maybe<PriceType>;
  /** The productʼs variants that will typically apply to this product. */
  retailPriceRange?: Maybe<PriceRangeType>;
  /** The merchant-entered sale price for a product overwrites the default price. The sale_price is optional. */
  salePrice?: Maybe<PriceType>;
  /** The amount that merchants save, determined by the difference between retail_price and calculated_price */
  saved?: Maybe<PriceType>;
  /** The variant ID of the item. */
  variantId?: Maybe<Scalars['Int']['output']>;
};

export type ProductAnonUploadInputType = {
  /** The channel ID of store */
  channelId?: InputMaybe<Scalars['Int']['input']>;
  /** The currency code of the display currency used to present prices. */
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  /** If can be add products to shopping cart */
  isToCart?: InputMaybe<Scalars['Boolean']['input']>;
  /** Product List */
  productList?: InputMaybe<Array<InputMaybe<ProductListType>>>;
  /** The store hash */
  storeHash: Scalars['String']['input'];
  /** With modifiers in response */
  withModifiers?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ProductInfoType = {
  __typename?: 'ProductInfoType';
  /** Availability of the product */
  availability?: Maybe<Scalars['String']['output']>;
  /** The channel ID of store */
  channelId?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  /** cost price */
  costPrice?: Maybe<Scalars['String']['output']>;
  /** The currency code of the display currency used to present prices. */
  currencyCode?: Maybe<Scalars['String']['output']>;
  /** The id of product */
  id?: Maybe<Scalars['Int']['output']>;
  /** The images url of product */
  imageUrl?: Maybe<Scalars['String']['output']>;
  /** The inventory warning level of product */
  inventoryLevel?: Maybe<Scalars['Int']['output']>;
  /** The inventory tracking of product */
  inventoryTracking?: Maybe<Scalars['String']['output']>;
  /** Indicating that whether the product's price should be shown on the product page. */
  isPriceHidden?: Maybe<Scalars['Boolean']['output']>;
  /** The modifiers sku of product */
  modifiers?: Maybe<Array<Maybe<Scalars['GenericScalar']['output']>>>;
  /** The name of product */
  name?: Maybe<Scalars['String']['output']>;
  /** The options of product */
  options?: Maybe<Array<Maybe<Scalars['GenericScalar']['output']>>>;
  /** The options of product form v3 version API */
  optionsV3?: Maybe<Array<Maybe<Scalars['GenericScalar']['output']>>>;
  /** The maximum quantity in an order */
  orderQuantityMaximum?: Maybe<Scalars['Int']['output']>;
  /** The minimum quantity in an order */
  orderQuantityMinimum?: Maybe<Scalars['Int']['output']>;
  /** The product url */
  productUrl?: Maybe<Scalars['String']['output']>;
  /** The sku id of product */
  sku?: Maybe<Scalars['String']['output']>;
  /** The tax class id of product */
  taxClassId?: Maybe<Scalars['Int']['output']>;
  /** The all variants of product */
  variants?: Maybe<Array<Maybe<Scalars['GenericScalar']['output']>>>;
  /** Whether the product has unlimited backorder */
  unlimitedBackorder?: Maybe<Scalars['Boolean']['output']>;
  /** The available to sell quantity of the product */
  availableToSell?: Maybe<Scalars['Int']['output']>;
};

export type ProductInputType = {
  /** Base price of this product */
  basePrice: Scalars['Decimal']['input'];
  /** Discount of this product */
  discount: Scalars['Decimal']['input'];
  /** Product image URL */
  imageUrl: Scalars['String']['input'];
  /** The discounted price must be passed on */
  offeredPrice: Scalars['Decimal']['input'];
  /** Options of the product */
  options?: InputMaybe<Array<InputMaybe<ProductOptionInputType>>>;
  /** Product ID */
  productId: Scalars['Int']['input'];
  /** Product name */
  productName: Scalars['String']['input'];
  /** Quantity of the product */
  quantity: Scalars['Int']['input'];
  /** Product SKU */
  sku: Scalars['String']['input'];
  /** Variant SKU ID */
  variantId: Scalars['Int']['input'];
};

export type ProductInventoryInputType = {
  /** The product id of product */
  productId: Scalars['Int']['input'];
  /** The quantity */
  quantity?: InputMaybe<Scalars['Int']['input']>;
  /** The variant id of product */
  variantId?: InputMaybe<Scalars['Int']['input']>;
};

export type ProductInventoryType = {
  __typename?: 'ProductInventoryType';
  /** if product is visible */
  isVisible?: Maybe<Scalars['Boolean']['output']>;
  /** The modifiers sku of product */
  modifiers?: Maybe<Array<Maybe<Scalars['GenericScalar']['output']>>>;
  /** The id of product */
  productId?: Maybe<Scalars['Int']['output']>;
  /** The inventory level of product */
  productInventoryLevel?: Maybe<Scalars['Int']['output']>;
  /** The inventory tracking of product */
  productInventoryTracking?: Maybe<Scalars['String']['output']>;
  /** The inventory warning level of product */
  productInventoryWarningLevel?: Maybe<Scalars['Int']['output']>;
  /** If can be purchased */
  purchasingDisabled?: Maybe<Scalars['Boolean']['output']>;
  /** If can be purchased */
  quantity?: Maybe<Scalars['Int']['output']>;
  /** The variant id of product */
  variantId?: Maybe<Scalars['Int']['output']>;
  /** The inventory level of product variant */
  variantInventoryLevel?: Maybe<Scalars['Int']['output']>;
  /** The inventory warning level of product variant */
  variantInventoryWarningLevel?: Maybe<Scalars['Int']['output']>;
};

export type ProductListType = {
  /** The quantity */
  qty?: InputMaybe<Scalars['String']['input']>;
  /** The sku of product */
  sku?: InputMaybe<Scalars['String']['input']>;
};

export type ProductOptionInputType = {
  optionId?: InputMaybe<Scalars['Int']['input']>;
  optionLabel?: InputMaybe<Scalars['String']['input']>;
  optionName?: InputMaybe<Scalars['String']['input']>;
  optionValue?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type ProductPurchasableType = {
  __typename?: 'ProductPurchasableType';
  /** The availability of product */
  availability?: Maybe<Scalars['String']['output']>;
  /** The inventory level of product */
  inventoryLevel?: Maybe<Scalars['Int']['output']>;
  /** The inventory tracking of product */
  inventoryTracking?: Maybe<Scalars['String']['output']>;
  /** The purchasing disabled of variant */
  purchasingDisabled?: Maybe<Scalars['Boolean']['output']>;
};

export type ProductType = {
  __typename?: 'ProductType';
  /** Whether the product is available for purchase */
  availability?: Maybe<Scalars['String']['output']>;
  /** Base price of this product */
  basePrice?: Maybe<Scalars['String']['output']>;
  /** The cost price of the product */
  costPrice?: Maybe<Scalars['String']['output']>;
  /** Discount of this product */
  discount?: Maybe<Scalars['String']['output']>;
  /** Product image URL */
  imageUrl?: Maybe<Scalars['String']['output']>;
  /** Current inventory level of the product */
  inventoryLevel?: Maybe<Scalars['Int']['output']>;
  /** The type of inventory tracking for the product */
  inventoryTracking?: Maybe<Scalars['String']['output']>;
  /** Whether the product has free shipping */
  isFreeShipping?: Maybe<Scalars['Boolean']['output']>;
  /** Indicating that this product's price should be shown on the product page */
  isPriceHidden?: Maybe<Scalars['Boolean']['output']>;
  /** Notes of the product */
  notes?: Maybe<Scalars['String']['output']>;
  /** The discounted price must be passed on */
  offeredPrice?: Maybe<Scalars['String']['output']>;
  /** Options of the product */
  options?: Maybe<Scalars['GenericScalar']['output']>;
  /** The maximum quantity for this order */
  orderQuantityMaximum?: Maybe<Scalars['Int']['output']>;
  /** The minimum quantity for this order */
  orderQuantityMinimum?: Maybe<Scalars['Int']['output']>;
  /** Product ID */
  productId?: Maybe<Scalars['String']['output']>;
  /** Product name */
  productName?: Maybe<Scalars['String']['output']>;
  /** The product url */
  productUrl?: Maybe<Scalars['String']['output']>;
  /** Whether the product is handled by sales rep, if product is out of stock */
  purchaseHandled?: Maybe<Scalars['Boolean']['output']>;
  /** Whether the variant is available for purchase */
  purchasingDisabled?: Maybe<Scalars['Boolean']['output']>;
  /** Quantity of the product */
  quantity?: Maybe<Scalars['Int']['output']>;
  /** Product SKU */
  sku?: Maybe<Scalars['String']['output']>;
  /** Product type */
  type?: Maybe<Scalars['String']['output']>;
  /** Variant SKU ID */
  variantId?: Maybe<Scalars['Int']['output']>;
};

export type ProductUploadInputType = {
  /** The channel ID of store */
  channelId?: InputMaybe<Scalars['Int']['input']>;
  /** The currency code of the display currency used to present prices. */
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  /** If can be add products to shopping cart */
  isToCart?: InputMaybe<Scalars['Boolean']['input']>;
  /** Product List */
  productList?: InputMaybe<Array<InputMaybe<ProductListType>>>;
  /** With modifiers in response */
  withModifiers?: InputMaybe<Scalars['Boolean']['input']>;
};

export type ProductUploadType = {
  __typename?: 'ProductUploadType';
  /** The url of error csv */
  errorFile?: Maybe<Scalars['String']['output']>;
  /** The list of valid csv */
  errorProduct?: Maybe<Scalars['GenericScalar']['output']>;
  /** The url of stock error csv */
  stockErrorFile?: Maybe<Scalars['String']['output']>;
  /** The valid of valid csv */
  stockErrorSkus?: Maybe<Scalars['GenericScalar']['output']>;
  /** The valid of valid csv */
  validProduct?: Maybe<Scalars['GenericScalar']['output']>;
};

export type ProductVariantInfoType = {
  __typename?: 'ProductVariantInfoType';
  /** Availability of the product */
  availability?: Maybe<Scalars['String']['output']>;
  /** The bulk price */
  bulkPrices?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The price of the product as seen on the storefront */
  calculatedPrice?: Maybe<Scalars['String']['output']>;
  /** The channel ID of store */
  channelId?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  /** The company ID */
  companyId?: Maybe<Scalars['Int']['output']>;
  /** cost price */
  costPrice?: Maybe<Scalars['String']['output']>;
  /** The currency code of the display currency used to present prices. */
  currencyCode?: Maybe<Scalars['String']['output']>;
  /** If has price list */
  hasPriceList?: Maybe<Scalars['Boolean']['output']>;
  /** The images url of product */
  imageUrl?: Maybe<Scalars['String']['output']>;
  /** The inventory warning level of product */
  inventoryLevel?: Maybe<Scalars['Int']['output']>;
  /** if product is visible */
  isAvailable?: Maybe<Scalars['Boolean']['output']>;
  /** Indicating that whether the product's price should be shown on the product page. */
  isPriceHidden?: Maybe<Scalars['Boolean']['output']>;
  /** The modifiers sku of product */
  modifiers?: Maybe<Array<Maybe<Scalars['GenericScalar']['output']>>>;
  /** The options of product */
  optionValues?: Maybe<Array<Maybe<Scalars['GenericScalar']['output']>>>;
  /** The id of product */
  productId?: Maybe<Scalars['Int']['output']>;
  /** If can be purchased */
  purchasingDisabled?: Maybe<Scalars['Boolean']['output']>;
  /** The sku of product */
  sku?: Maybe<Scalars['String']['output']>;
  /** The store hash */
  storeHash?: Maybe<Scalars['String']['output']>;
  /** The variant id of product */
  variantId?: Maybe<Scalars['Int']['output']>;
};

export type ProductVariantInputType = {
  /** The product id of product */
  productId: Scalars['Int']['input'];
  /** The variant id of product */
  variantId: Scalars['Int']['input'];
};

/**
 * CSV Upload for anon
 * Doesn't require a Token.
 */
export type ProductsAnonUpload = {
  __typename?: 'ProductsAnonUpload';
  result?: Maybe<ProductUploadType>;
};

/**
 * CSV Upload.
 * Requires either a B2B or BC Token.
 */
export type ProductsUpload = {
  __typename?: 'ProductsUpload';
  result?: Maybe<ProductUploadType>;
};

export type Query = {
  __typename?: 'Query';
  /**
   * Get a list of form fields for an account.
   * Doesn't require a Token.
   */
  accountFormFields?: Maybe<Array<Maybe<AccountFormFieldsType>>>;
  /**
   * Details of account settings.
   * Requires a B2B Token.
   */
  accountSettings?: Maybe<AccountSettingType>;
  /**
   * Details of the company address selected.
   * Requires a B2B Token.
   */
  address?: Maybe<AddressType>;
  /**
   * Address configurations for the store.
   * Doesn't require a Token.
   */
  addressConfig?: Maybe<Array<Maybe<AddressStoreConfigType>>>;
  /**
   * Get address extra fields in the company configurations.
   * Doesn't require a Token.
   */
  addressExtraFields?: Maybe<Array<Maybe<ExtraFieldsConfigType>>>;
  /**
   * The list of addresses registered to the company.
   * Requires a B2B Token.
   */
  addresses?: Maybe<AddressTypeCountableConnection>;
  /**
   * Get orders.
   * Requires a B2B Token.
   */
  allOrders?: Maybe<OrderTypeCountableConnection>;
  /**
   * List of all the receipt lines.
   * Requires IP authentication.
   */
  allReceiptLines?: Maybe<ReceiptLinesTypeCountableConnection>;
  /**
   * The auto loader of a store.
   * Doesn't require a Token.
   */
  autoLoader?: Maybe<StoreAutoLoaderType>;
  /**
   * BC customer get order statuses of a store.
   * Requires a BC Token.
   */
  bcOrderStatuses?: Maybe<Array<Maybe<OrderStatusType>>>;
  /**
   * Get company credit config.
   * Requires a B2B Token.
   */
  companyCreditConfig?: Maybe<CompanyCreditConfigType>;
  /**
   * Get extra fields configurations of a company.
   * Doesn't require a Token.
   */
  companyExtraFields?: Maybe<Array<Maybe<ExtraFieldsConfigType>>>;
  /**
   * Get company payment terms.
   * Requires a B2B Token.
   */
  companyPaymentTerms?: Maybe<CompanyPaymentTermsType>;
  /**
   * Get all company permissions.
   * Requires a B2B Token.
   */
  companyPermissions?: Maybe<Array<Maybe<CompanyPermissionsType>>>;
  /**
   * Get company role detail, contains permissions of the role.
   * Requires a B2B Token.
   */
  companyRole?: Maybe<CompanyRoleType>;
  /**
   * Get company roles, which can be searched by name, code.
   * Requires a B2B Token.
   */
  companyRoles?: Maybe<CompanyRolesTypeCountableConnection>;
  /**
   * This API is deprecated, use 'userEmailCheck' instead.
   * Get the information of a user.
   * Doesn't require a Token.
   */
  companyUserInfo?: Maybe<CompanyUserInfoType>;
  /**
   * Check if a user email can be used for the current company.
   * Doesn't require a Token.
   */
  companyValidateEmail?: Maybe<CompanyEmailValidateType>;
  /**
   * List of countries and states in the country.
   * Doesn't require a Token.
   */
  countries?: Maybe<Array<Maybe<CountryType>>>;
  /**
   * Get orders created by a company.
   * Requires a B2B Token.
   */
  createdByUser?: Maybe<CreateByType>;
  /**
   * The currencies configured for a store.
   * Doesn't require a Token.
   */
  currencies?: Maybe<StoreCurrencies>;
  /**
   * Get current user details.
   * Requires a B2B Token.
   */
  currentUser?: Maybe<UserType>;
  /**
   * Details of account settings.
   * Requires a BC Token.
   */
  customerAccountSettings?: Maybe<CustomerAccountSettingsType>;
  /**
   * Details of the user address selected.
   * Requires a BC Token.
   */
  customerAddress?: Maybe<CustomerAddressType>;
  /**
   * The list of addresses registered to the user.
   * Requires a BC Token.
   */
  customerAddresses?: Maybe<CustomerAddressTypeCountableConnection>;
  /**
   * Check if a customer email exists in BC, supports multi-storefront.
   * Doesn't require a Token.
   */
  customerEmailCheck?: Maybe<CustomerEmailCheckType>;
  /**
   * Retrieves customer info, type and permissions.
   * Requires a B2B Token.
   */
  customerInfo?: Maybe<CustomerInfoType>;
  /**
   * Get the details of a BC customer's order.
   * Requires a BC Token.
   */
  customerOrder?: Maybe<BcOrderType>;
  /**
   * Get a list of orders for a BC customer.
   * Requires a BC Token.
   */
  customerOrders?: Maybe<OrderTypeCountableConnection>;
  /**
   * Get the list of quotes for a customer.
   * Requires a BC Token.
   */
  customerQuotes?: Maybe<QuoteTypeCountableConnection>;
  /**
   * Get a the shopping list by ID.
   * Requires a BC Token.
   */
  customerShoppingList?: Maybe<CustomerShoppingListType>;
  /**
   * Get all the shopping lists.
   * Requires a BC Token.
   */
  customerShoppingLists?: Maybe<CustomerShoppingListPageTypeCountableConnection>;
  /**
   * Get all the shopping lists that contains both ID and name.
   * Requires a BC Token.
   */
  customerShoppingListsIdName?: Maybe<Array<Maybe<CustomerShoppingListIdNameType>>>;
  /**
   * Details of the company's default billing address.
   * Requires a B2B Token.
   */
  defaultBillingAddress?: Maybe<AddressType>;
  /**
   * Details of the company's default shipping address.
   * Requires a B2B Token.
   */
  defaultShippingAddress?: Maybe<AddressType>;
  /**
   * Get the details of an invoice.
   * Requires IP authentication.
   */
  invoice?: Maybe<InvoiceType>;
  /**
   * Information of BC allow methods.
   * Requires a B2B Token.
   */
  invoiceBcOrderAllowMethods?: Maybe<BcOrderAllowMethodsType>;
  /**
   * Get the company and customer information of an invoice.
   * Requires IP authentication.
   */
  invoiceCustomerInformation?: Maybe<InvoiceCustomerInformationType>;
  /**
   * The Details of an invoice payment.
   * Requires a B2B Token.
   */
  invoicePayment?: Maybe<InvoicePaymentType>;
  /**
   * Information of an invoice payment related BC cart.
   * Requires a B2B Token.
   */
  invoicePaymentBcCart?: Maybe<PaymentRelatedCartType>;
  /**
   * Invoice payment fees.
   * Requires a B2B Token.
   */
  invoicePaymentFees?: Maybe<PaymentFeesType>;
  /**
   * List of invoice payment modules.
   * Requires a B2B Token.
   */
  invoicePaymentModules?: Maybe<Array<Maybe<PaymentModuleType>>>;
  /**
   * The list of invoice payments.
   * Requires a B2B Token.
   */
  invoicePayments?: Maybe<InvoicePaymentTypeCountableConnection>;
  /**
   * Get the stats of an invoice.
   * Requires IP authentication.
   */
  invoiceStats?: Maybe<InvoiceStatsType>;
  /**
   * Get the list of invoices.
   * Requires IP authentication.
   */
  invoices?: Maybe<InvoiceTypeCountableConnection>;
  /**
   * Get an order details.
   * Requires a B2B Token.
   */
  order?: Maybe<BcOrderType>;
  /**
   * Get the image url for a list of orders.
   * Requires a B2B Token.
   */
  orderImages?: Maybe<Array<Maybe<OrderImageType>>>;
  /**
   * Get a list of the products in an order.
   * Requires a B2B Token.
   */
  orderProducts?: Maybe<Array<Maybe<OrderProductType>>>;
  /**
   * A B2B store orders statuses.
   * Requires a B2B Token.
   */
  orderStatuses?: Maybe<Array<Maybe<OrderStatusType>>>;
  /**
   * Get an ordered list of the products.
   * Requires a B2B or BC Token.
   */
  orderedProducts?: Maybe<OrderedProductTypeCountableConnection>;
  /** Calculate batch pricing for products for a specific channel, currency, and customer group. */
  priceProducts?: Maybe<Array<Maybe<PricingProductType>>>;
  productPurchasable?: Maybe<ProductPurchasableType>;
  /**
   * Information on a product variants.
   * Requires a B2B Token.
   */
  productVariantsInfo?: Maybe<Array<Maybe<CatalogsVariantType>>>;
  /**
   * Inventory information for a product.
   * Requires a B2B Token.
   */
  productsInventory?: Maybe<Array<Maybe<ProductInventoryType>>>;
  /**
   * Inventory information for a product.
   * Requires a B2B Token.
   * Needs at least one parameter.
   */
  productsLoad?: Maybe<Array<Maybe<ProductVariantInfoType>>>;
  /**
   * search products by name,sku,id.
   * Doesn't require a Token.
   */
  productsSearch?: Maybe<Array<Maybe<ProductInfoType>>>;
  /**
   * Get the details of a quote.
   * Doesn't require a Token.
   */
  quote?: Maybe<QuoteType>;
  /**
   * Get the quote configurations of a store.
   * Doesn't require a Token.
   */
  quoteConfig?: Maybe<QuoteConfigType>;
  /**
   * Get the extra fields configurations for a quote.
   * Requires a B2B Token.
   */
  quoteExtraFieldsConfig?: Maybe<Array<Maybe<QuoteExtraFieldsConfigType>>>;
  /**
   * Get the store information of a quote.
   * Requires a B2B Token.
   */
  quoteUserStoreInfo?: Maybe<StoreUserInfo>;
  /**
   * Get the list of quotes.
   * Requires a B2B Token.
   */
  quotes?: Maybe<QuoteTypeCountableConnection>;
  /**
   * The details of a receipt.
   * Requires IP authentication.
   */
  receipt?: Maybe<ReceiptType>;
  /**
   * The details of a receipt line.
   * Requires IP authentication.
   */
  receiptLine?: Maybe<ReceiptLinesType>;
  /**
   * List of receipt lines for the specified receipt.
   * Requires IP authentication.
   */
  receiptLines?: Maybe<ReceiptLinesTypeCountableConnection>;
  /**
   * A list of receipts.
   * Requires IP authentication.
   */
  receipts?: Maybe<ReceiptTypeCountableConnection>;
  /**
   * Get a shopping list by id.
   * Requires a B2B Token.
   */
  shoppingList?: Maybe<ShoppingListType>;
  /**
   * Get all the shopping lists.
   * Requires a B2B Token.
   */
  shoppingLists?: Maybe<ShoppingListPageTypeCountableConnection>;
  /**
   * Get all the shopping lists that contains both id and name.
   * Requires a B2B Token.
   */
  shoppingListsIdName?: Maybe<Array<Maybe<ShoppingListIdNameType>>>;
  /**
   * Basic information about the store.
   * Doesn't require a Token.
   */
  storeBasicInfo?: Maybe<StoreBasicInfoType>;
  /**
   * The checkout configurations of a store.
   * Requires a B2B Token.
   */
  storeCheckoutConfig?: Maybe<Array<Maybe<CheckoutConfigType>>>;
  /**
   * The switch status of the store configurations.
   * Requires a B2B Token.
   */
  storeConfigSwitchStatus?: Maybe<StoreConfigType>;
  /**
   * The limitations details of a store.
   * Doesn't require a Token.
   */
  storeLimitations?: Maybe<StoreLimitationsType>;
  /**
   * The storefront configurations of a store.
   * Doesn't require a Token.
   */
  storefrontConfig?: Maybe<StoreFrontConfigType>;
  /**
   * The new storefront configurations.
   * Doesn't require a Token.
   */
  storefrontConfigs?: Maybe<Array<Maybe<StorefrontConfigType>>>;
  /** Get storefront default language. */
  storefrontDefaultLanguage?: Maybe<StorefrontLanguageType>;
  /** Get storefront product settings. */
  storefrontProductSettings?: Maybe<StorefrontProductSettingType>;
  /**
   * Get storefront scripts.
   * Requires either a storeHash or the siteUrl.
   * Doesn't require a Token.
   */
  storefrontScript?: Maybe<StorefrontScriptType>;
  /**
   * Get a list of companies by super admin.
   * Requires a B2B token.
   */
  superAdminCompanies?: Maybe<SuperAdminCompanyTypeCountableConnection>;
  /**
   * Get the masquerading company of a customer.
   * Requires a B2B token.
   */
  superAdminMasquerading?: Maybe<CompanyType>;
  /**
   * Get the tax zone information.
   * Doesn't require a Token.
   */
  taxZoneRates?: Maybe<Array<Maybe<TaxZoneRateType>>>;
  /**
   * Details of a company user.
   * Requires a B2B Token.
   */
  user?: Maybe<UserType>;
  /**
   * Get a company details by user id.
   * Requires a B2B Token.
   */
  userCompany?: Maybe<CompanyType>;
  /**
   * Check if a user email exists in B2B or BC, supports multi-storefront.
   * Requires a B2B Token.
   */
  userEmailCheck?: Maybe<UserEmailCheckType>;
  /**
   * Get extra fields configurations of a user.
   * Requires a B2B Token.
   */
  userExtraFields?: Maybe<Array<Maybe<ExtraFieldsConfigType>>>;
  /**
   * List of company users.
   * Requires a B2B Token.
   */
  users?: Maybe<UserTypeCountableConnection>;
  /**
   * information on the variants of a product.
   * Doesn't require a Token.
   */
  variantSku?: Maybe<Array<Maybe<CatalogQuickProductType>>>;
};

export type QueryAccountFormFieldsArgs = {
  formType: Scalars['Int']['input'];
  storeHash: Scalars['String']['input'];
};

export type QueryAccountSettingsArgs = {
  companyId: Scalars['Int']['input'];
};

export type QueryAddressArgs = {
  addressId: Scalars['Int']['input'];
  companyId: Scalars['Int']['input'];
};

export type QueryAddressConfigArgs = {
  storeHash: Scalars['String']['input'];
};

export type QueryAddressExtraFieldsArgs = {
  storeHash: Scalars['String']['input'];
};

export type QueryAddressesArgs = {
  address?: InputMaybe<Scalars['String']['input']>;
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  company?: InputMaybe<Scalars['String']['input']>;
  companyId: Scalars['Int']['input'];
  country?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  isBilling?: InputMaybe<Scalars['Decimal']['input']>;
  isShipping?: InputMaybe<Scalars['Decimal']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  uuid?: InputMaybe<Scalars['String']['input']>;
};

export type QueryAllOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  bcOrderId?: InputMaybe<Scalars['Decimal']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  beginDateAt?: InputMaybe<Scalars['Date']['input']>;
  companyId?: InputMaybe<Scalars['Decimal']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  endDateAt?: InputMaybe<Scalars['Date']['input']>;
  extraInt1?: InputMaybe<Scalars['Decimal']['input']>;
  extraInt2?: InputMaybe<Scalars['Decimal']['input']>;
  extraInt3?: InputMaybe<Scalars['Decimal']['input']>;
  extraInt4?: InputMaybe<Scalars['Decimal']['input']>;
  extraInt5?: InputMaybe<Scalars['Decimal']['input']>;
  extraStr1?: InputMaybe<Scalars['String']['input']>;
  extraStr1_In?: InputMaybe<Scalars['String']['input']>;
  extraStr2?: InputMaybe<Scalars['String']['input']>;
  extraStr3?: InputMaybe<Scalars['String']['input']>;
  extraStr4?: InputMaybe<Scalars['String']['input']>;
  extraStr5?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  isShowMy?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  poNumber?: InputMaybe<Scalars['String']['input']>;
  q?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type QueryAllReceiptLinesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  invoiceId?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  paymentStatus?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type QueryAutoLoaderArgs = {
  storeHash: Scalars['String']['input'];
};

export type QueryCompanyExtraFieldsArgs = {
  storeHash: Scalars['String']['input'];
};

export type QueryCompanyPaymentTermsArgs = {
  companyId: Scalars['Int']['input'];
};

export type QueryCompanyRoleArgs = {
  companyId?: InputMaybe<Scalars['Int']['input']>;
  roleId: Scalars['Int']['input'];
};

export type QueryCompanyRolesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  companyId?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type QueryCompanyUserInfoArgs = {
  customerId?: InputMaybe<Scalars['Int']['input']>;
  email: Scalars['String']['input'];
  storeHash: Scalars['String']['input'];
};

export type QueryCompanyValidateEmailArgs = {
  channelId?: InputMaybe<Scalars['Int']['input']>;
  email: Scalars['String']['input'];
  role: Scalars['Int']['input'];
  storeHash: Scalars['String']['input'];
};

export type QueryCountriesArgs = {
  storeHash?: InputMaybe<Scalars['String']['input']>;
};

export type QueryCreatedByUserArgs = {
  companyId: Scalars['Int']['input'];
  module: Scalars['Int']['input'];
};

export type QueryCurrenciesArgs = {
  channelId: Scalars['String']['input'];
  storeHash: Scalars['String']['input'];
};

export type QueryCustomerAddressArgs = {
  addressId: Scalars['Int']['input'];
};

export type QueryCustomerAddressesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  company?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  stateOrProvince?: InputMaybe<Scalars['String']['input']>;
};

export type QueryCustomerEmailCheckArgs = {
  channelId?: InputMaybe<Scalars['Int']['input']>;
  email: Scalars['String']['input'];
  storeHash: Scalars['String']['input'];
};

export type QueryCustomerOrderArgs = {
  id: Scalars['Int']['input'];
};

export type QueryCustomerOrdersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  bcOrderId?: InputMaybe<Scalars['Decimal']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  beginDateAt?: InputMaybe<Scalars['Date']['input']>;
  channelId?: InputMaybe<Scalars['Int']['input']>;
  companyId?: InputMaybe<Scalars['Decimal']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  endDateAt?: InputMaybe<Scalars['Date']['input']>;
  extraInt1?: InputMaybe<Scalars['Decimal']['input']>;
  extraInt2?: InputMaybe<Scalars['Decimal']['input']>;
  extraInt3?: InputMaybe<Scalars['Decimal']['input']>;
  extraInt4?: InputMaybe<Scalars['Decimal']['input']>;
  extraInt5?: InputMaybe<Scalars['Decimal']['input']>;
  extraStr1?: InputMaybe<Scalars['String']['input']>;
  extraStr1_In?: InputMaybe<Scalars['String']['input']>;
  extraStr2?: InputMaybe<Scalars['String']['input']>;
  extraStr3?: InputMaybe<Scalars['String']['input']>;
  extraStr4?: InputMaybe<Scalars['String']['input']>;
  extraStr5?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  isShowMy?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  poNumber?: InputMaybe<Scalars['String']['input']>;
  q?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['String']['input']>;
};

export type QueryCustomerQuotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  channelId?: InputMaybe<Scalars['Int']['input']>;
  company?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  dateCreatedBeginAt?: InputMaybe<Scalars['Date']['input']>;
  dateCreatedEndAt?: InputMaybe<Scalars['Date']['input']>;
  dateExpiredBeginAt?: InputMaybe<Scalars['Date']['input']>;
  dateExpiredEndAt?: InputMaybe<Scalars['Date']['input']>;
  dateUpdatedBeginAt?: InputMaybe<Scalars['Date']['input']>;
  dateUpdatedEndAt?: InputMaybe<Scalars['Date']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  quoteNumber?: InputMaybe<Scalars['String']['input']>;
  quoteTitle?: InputMaybe<Scalars['String']['input']>;
  salesRep?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['Decimal']['input']>;
};

export type QueryCustomerShoppingListArgs = {
  id: Scalars['Int']['input'];
};

export type QueryCustomerShoppingListsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  channelId?: InputMaybe<Scalars['Int']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type QueryCustomerShoppingListsIdNameArgs = {
  channelId?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryDefaultBillingAddressArgs = {
  companyId: Scalars['Int']['input'];
};

export type QueryDefaultShippingAddressArgs = {
  companyId: Scalars['Int']['input'];
};

export type QueryInvoiceArgs = {
  invoiceId: Scalars['Int']['input'];
};

export type QueryInvoicePaymentArgs = {
  paymentId: Scalars['Int']['input'];
};

export type QueryInvoicePaymentBcCartArgs = {
  paymentId: Scalars['Int']['input'];
};

export type QueryInvoicePaymentsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  dateCreatedBeginAt?: InputMaybe<Scalars['Date']['input']>;
  dateCreatedEndAt?: InputMaybe<Scalars['Date']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  invoiceId?: InputMaybe<Scalars['Decimal']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
};

export type QueryInvoiceStatsArgs = {
  decimalPlaces?: InputMaybe<Scalars['Int']['input']>;
  status: Scalars['Int']['input'];
};

export type QueryInvoicesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  beginDateAt?: InputMaybe<Scalars['Decimal']['input']>;
  beginDueDateAt?: InputMaybe<Scalars['Decimal']['input']>;
  endDateAt?: InputMaybe<Scalars['Decimal']['input']>;
  endDueDateAt?: InputMaybe<Scalars['Decimal']['input']>;
  externalCustomerId?: InputMaybe<Scalars['String']['input']>;
  externalId?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  idIn?: InputMaybe<Scalars['String']['input']>;
  invoiceNumber?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  orderNumber?: InputMaybe<Scalars['String']['input']>;
  purchaseOrderNumber?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  storeHash?: InputMaybe<Scalars['String']['input']>;
  type?: InputMaybe<Scalars['String']['input']>;
};

export type QueryOrderArgs = {
  id: Scalars['Int']['input'];
};

export type QueryOrderImagesArgs = {
  orderIds: Array<InputMaybe<Scalars['Int']['input']>>;
};

export type QueryOrderProductsArgs = {
  bcOrderId: Scalars['Int']['input'];
};

export type QueryOrderedProductsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  beginDateAt?: InputMaybe<Scalars['Date']['input']>;
  channelId?: InputMaybe<Scalars['Int']['input']>;
  endDateAt?: InputMaybe<Scalars['Date']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  maxOrderedTimes?: InputMaybe<Scalars['Decimal']['input']>;
  minOrderedTimes?: InputMaybe<Scalars['Decimal']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  productId?: InputMaybe<Scalars['Decimal']['input']>;
  q?: InputMaybe<Scalars['String']['input']>;
};

export type QueryPriceProductsArgs = {
  channelId?: InputMaybe<Scalars['Int']['input']>;
  currencyCode: Scalars['String']['input'];
  customerGroupId?: InputMaybe<Scalars['Int']['input']>;
  items: Array<InputMaybe<PricingProductItemInputType>>;
  storeHash?: InputMaybe<Scalars['String']['input']>;
};

export type QueryProductPurchasableArgs = {
  isProduct?: InputMaybe<Scalars['Boolean']['input']>;
  productId?: InputMaybe<Scalars['Int']['input']>;
  sku?: InputMaybe<Scalars['String']['input']>;
  storeHash?: InputMaybe<Scalars['String']['input']>;
};

export type QueryProductVariantsInfoArgs = {
  productId: Scalars['String']['input'];
};

export type QueryProductsInventoryArgs = {
  products: Array<InputMaybe<ProductInventoryInputType>>;
};

export type QueryProductsLoadArgs = {
  companyId?: InputMaybe<Scalars['String']['input']>;
  currencyCode: Scalars['String']['input'];
  productList: Array<InputMaybe<ProductVariantInputType>>;
};

export type QueryProductsSearchArgs = {
  categoryFilter?: InputMaybe<Scalars['Boolean']['input']>;
  channelId?: InputMaybe<Scalars['Int']['input']>;
  companyId?: InputMaybe<Scalars['String']['input']>;
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  customerGroupId?: InputMaybe<Scalars['Int']['input']>;
  limit?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  productIds?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  search?: InputMaybe<Scalars['String']['input']>;
  showAllProducts?: InputMaybe<Scalars['Boolean']['input']>;
  storeHash?: InputMaybe<Scalars['String']['input']>;
};

export type QueryQuoteArgs = {
  date: Scalars['String']['input'];
  id: Scalars['Int']['input'];
  storeHash: Scalars['String']['input'];
};

export type QueryQuoteConfigArgs = {
  storeHash: Scalars['String']['input'];
};

export type QueryQuoteUserStoreInfoArgs = {
  companyId?: InputMaybe<Scalars['Int']['input']>;
  salesRepId?: InputMaybe<Scalars['Int']['input']>;
  storeHash?: InputMaybe<Scalars['String']['input']>;
};

export type QueryQuotesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  company?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  dateCreatedBeginAt?: InputMaybe<Scalars['Date']['input']>;
  dateCreatedEndAt?: InputMaybe<Scalars['Date']['input']>;
  dateExpiredBeginAt?: InputMaybe<Scalars['Date']['input']>;
  dateExpiredEndAt?: InputMaybe<Scalars['Date']['input']>;
  dateUpdatedBeginAt?: InputMaybe<Scalars['Date']['input']>;
  dateUpdatedEndAt?: InputMaybe<Scalars['Date']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  quoteNumber?: InputMaybe<Scalars['String']['input']>;
  quoteTitle?: InputMaybe<Scalars['String']['input']>;
  salesRep?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Scalars['Decimal']['input']>;
};

export type QueryReceiptArgs = {
  id: Scalars['Int']['input'];
};

export type QueryReceiptLineArgs = {
  id: Scalars['Int']['input'];
};

export type QueryReceiptLinesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  invoiceId?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  receiptId: Scalars['Int']['input'];
  search?: InputMaybe<Scalars['String']['input']>;
};

export type QueryReceiptsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  paymentStatus?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type QueryShoppingListArgs = {
  id: Scalars['Int']['input'];
};

export type QueryShoppingListsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  createdBy?: InputMaybe<Scalars['String']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  isDefault?: InputMaybe<Scalars['Boolean']['input']>;
  isShowMy?: InputMaybe<Scalars['Boolean']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  status?: InputMaybe<Array<InputMaybe<Scalars['Int']['input']>>>;
};

export type QueryStoreBasicInfoArgs = {
  bcChannelId?: InputMaybe<Scalars['Int']['input']>;
  storeHash: Scalars['String']['input'];
};

export type QueryStoreConfigSwitchStatusArgs = {
  key: Scalars['String']['input'];
};

export type QueryStoreLimitationsArgs = {
  limitationType: Scalars['Int']['input'];
  storeHash: Scalars['String']['input'];
};

export type QueryStorefrontConfigArgs = {
  storeHash: Scalars['String']['input'];
};

export type QueryStorefrontConfigsArgs = {
  channelId?: InputMaybe<Scalars['Int']['input']>;
  keys?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>;
  storeHash: Scalars['String']['input'];
};

export type QueryStorefrontDefaultLanguageArgs = {
  channelId: Scalars['Int']['input'];
  storeHash: Scalars['String']['input'];
};

export type QueryStorefrontProductSettingsArgs = {
  channelId?: InputMaybe<Scalars['Int']['input']>;
  storeHash: Scalars['String']['input'];
};

export type QueryStorefrontScriptArgs = {
  channelId?: InputMaybe<Scalars['Int']['input']>;
  siteUrl?: InputMaybe<Scalars['String']['input']>;
  storeHash?: InputMaybe<Scalars['String']['input']>;
};

export type QuerySuperAdminCompaniesArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
  superAdminId: Scalars['Int']['input'];
};

export type QuerySuperAdminMasqueradingArgs = {
  customerId: Scalars['Int']['input'];
};

export type QueryTaxZoneRatesArgs = {
  storeHash: Scalars['String']['input'];
};

export type QueryUserArgs = {
  companyId: Scalars['Int']['input'];
  userId: Scalars['Int']['input'];
};

export type QueryUserCompanyArgs = {
  userId: Scalars['Int']['input'];
};

export type QueryUserEmailCheckArgs = {
  channelId?: InputMaybe<Scalars['Int']['input']>;
  companyId?: InputMaybe<Scalars['Int']['input']>;
  email: Scalars['String']['input'];
  storeHash?: InputMaybe<Scalars['String']['input']>;
};

export type QueryUsersArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  companyId: Scalars['Int']['input'];
  companyRoleId?: InputMaybe<Scalars['Decimal']['input']>;
  email?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  role?: InputMaybe<Scalars['Decimal']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type QueryVariantSkuArgs = {
  channelId?: InputMaybe<Scalars['Int']['input']>;
  currencyCode?: InputMaybe<Scalars['String']['input']>;
  storeHash: Scalars['String']['input'];
  variantSkus: Array<InputMaybe<Scalars['String']['input']>>;
};

export type QuoteAddressExtraFieldsInputType = {
  fieldName?: InputMaybe<Scalars['String']['input']>;
  fieldValue?: InputMaybe<Scalars['String']['input']>;
};

export type QuoteAttachFiles = {
  __typename?: 'QuoteAttachFiles';
  createdBy?: Maybe<Scalars['String']['output']>;
  fileName?: Maybe<Scalars['String']['output']>;
  fileType?: Maybe<Scalars['String']['output']>;
  fileUrl?: Maybe<Scalars['String']['output']>;
  id?: Maybe<Scalars['Int']['output']>;
};

/**
 * Create attachment for a quote.
 * Requires either B2B or BC Token.
 */
export type QuoteAttachmentCreate = {
  __typename?: 'QuoteAttachmentCreate';
  attachFiles?: Maybe<Array<Maybe<QuoteAttachFiles>>>;
};

/**
 * Delete Attachment from a quote.
 * Requires either B2B or BC Token.
 */
export type QuoteAttachmentDelete = {
  __typename?: 'QuoteAttachmentDelete';
  message?: Maybe<Scalars['String']['output']>;
};

/**
 * Get the checkout information for a quote.
 * Doesn't require a Token.
 */
export type QuoteCheckout = {
  __typename?: 'QuoteCheckout';
  quoteCheckout?: Maybe<QuoteCheckoutType>;
};

export type QuoteCheckoutType = {
  __typename?: 'QuoteCheckoutType';
  cartId?: Maybe<Scalars['String']['output']>;
  cartUrl?: Maybe<Scalars['String']['output']>;
  checkoutUrl?: Maybe<Scalars['String']['output']>;
};

export type QuoteConfigType = {
  __typename?: 'QuoteConfigType';
  otherConfigs?: Maybe<Array<Maybe<QuoteOtherConfigType>>>;
  switchStatus?: Maybe<Array<Maybe<QuoteSwitchConfigType>>>;
};

/**
 * Create a new quote.
 * Requires B2B or BC token only if store has disabled guest quotes
 */
export type QuoteCreate = {
  __typename?: 'QuoteCreate';
  quote?: Maybe<QuoteType>;
};

export type QuoteCurrencyInputType = {
  /** The exchange rate between the store’s default currency and the display currency. */
  currencyExchangeRate: Scalars['String']['input'];
  /** Currency token */
  token?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Send a Quote Email.
 * Requires either B2B or BC Token.
 */
export type QuoteEmail = {
  __typename?: 'QuoteEmail';
  message?: Maybe<Scalars['String']['output']>;
};

export type QuoteEmailInputType = {
  /** The quote ID you want to use */
  email: Scalars['String']['input'];
  /** Which email you want to send */
  quoteId: Scalars['Int']['input'];
};

export type QuoteExtraFieldsConfigType = Node & {
  __typename?: 'QuoteExtraFieldsConfigType';
  fieldName?: Maybe<Scalars['String']['output']>;
  fieldType?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  isRequired?: Maybe<Scalars['Boolean']['output']>;
  isUnique?: Maybe<Scalars['Boolean']['output']>;
  valueConfigs?: Maybe<Scalars['GenericScalar']['output']>;
};

export type QuoteExtraFieldsInputType = {
  fieldName?: InputMaybe<Scalars['String']['input']>;
  id?: InputMaybe<Scalars['Int']['input']>;
  value?: InputMaybe<Scalars['String']['input']>;
};

export type QuoteExtraFieldsValueType = {
  __typename?: 'QuoteExtraFieldsValueType';
  fieldName?: Maybe<Scalars['String']['output']>;
  fieldValue?: Maybe<Scalars['String']['output']>;
};

export type QuoteFileListInputType = {
  fileName: Scalars['String']['input'];
  fileSize?: InputMaybe<Scalars['Int']['input']>;
  fileType: Scalars['String']['input'];
  fileUrl: Scalars['String']['input'];
  id?: InputMaybe<Scalars['Int']['input']>;
};

/** Export a quote PDF. */
export type QuoteFrontendPdf = {
  __typename?: 'QuoteFrontendPdf';
  content?: Maybe<Scalars['String']['output']>;
  url?: Maybe<Scalars['String']['output']>;
};

export type QuoteInputType = {
  /**
   * Billing address of the quote.
   * This field is required, even if its an empty object.
   */
  billingAddress: BillingAddressInputType;
  /** The channel ID of the quote */
  channelId?: InputMaybe<Scalars['Int']['input']>;
  /** Company ID of the quote */
  companyId?: InputMaybe<Scalars['Int']['input']>;
  /**
   * Contact info of the quote.
   * This field is required.
   */
  contactInfo: ContactInfoInputType;
  /**
   * Currency type for the quote.
   * This field is required, even if its an empty object.
   */
  currency: CurrencyInputType;
  /**
   * Discount applied to the quote.
   * This field is required.
   */
  discount: Scalars['Decimal']['input'];
  /** Discount type the quote */
  discountType?: InputMaybe<Scalars['Int']['input']>;
  /** Discount value of the quote */
  discountValue?: InputMaybe<Scalars['Decimal']['input']>;
  /** Expiration date for the quote */
  expiredAt?: InputMaybe<Scalars['String']['input']>;
  /** Extra fields of the quote */
  extraFields?: InputMaybe<Array<InputMaybe<QuoteExtraFieldsInputType>>>;
  /** File list of the quote */
  fileList?: InputMaybe<Array<InputMaybe<QuoteFileListInputType>>>;
  /**
   * Grand total amount of the quote.
   * This field is required.
   */
  grandTotal: Scalars['Decimal']['input'];
  /** Legal terms of the quote */
  legalTerms?: InputMaybe<Scalars['String']['input']>;
  /** Message of the quote */
  message?: InputMaybe<Scalars['String']['input']>;
  /** Notes of the quote */
  notes?: InputMaybe<Scalars['String']['input']>;
  /**
   * The list of products to be included in the quote.
   * This field is required.
   */
  productList: Array<InputMaybe<ProductInputType>>;
  /** Title of the quote */
  quoteTitle?: InputMaybe<Scalars['String']['input']>;
  /** recipients of the quote */
  recipients?: InputMaybe<Array<InputMaybe<Scalars['GenericScalar']['input']>>>;
  /** Reference number of the quote */
  referenceNumber?: InputMaybe<Scalars['String']['input']>;
  /**
   * Shipping address of the quote.
   * This field is required, even if its an empty object.
   */
  shippingAddress: ShippingAddressInputType;
  /** Shipping method of the quote */
  shippingMethod?: InputMaybe<Scalars['GenericScalar']['input']>;
  /** Shipping total amount of the quote */
  shippingTotal?: InputMaybe<Scalars['Decimal']['input']>;
  /**
   * Store hash.
   * This field is required.
   */
  storeHash: Scalars['String']['input'];
  /**
   * Subtotal amount of the quote.
   * This field is required.
   */
  subtotal: Scalars['Decimal']['input'];
  /** total tax amount of the quote */
  taxTotal?: InputMaybe<Scalars['Decimal']['input']>;
  /** Total amount of the quote */
  totalAmount?: InputMaybe<Scalars['Decimal']['input']>;
  /** User email of the quote */
  userEmail?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Ordered a quote.
 * Requires either B2B or BC Token.
 */
export type QuoteOrdered = {
  __typename?: 'QuoteOrdered';
  message?: Maybe<Scalars['String']['output']>;
};

export type QuoteOrderedInputType = {
  /** Unique order ID */
  orderId: Scalars['String']['input'];
  shippingMethod: ShippingMethodInputType;
  /** Shipping total price */
  shippingTotal: Scalars['Decimal']['input'];
  /** Store Hash */
  storeHash: Scalars['String']['input'];
  /** Tax total price */
  taxTotal: Scalars['Decimal']['input'];
};

export type QuoteOtherConfigType = {
  __typename?: 'QuoteOtherConfigType';
  /** key of a config */
  key?: Maybe<Scalars['String']['output']>;
  /** config value */
  value?: Maybe<Scalars['String']['output']>;
};

/**
 * This API is deprecated, please use QuoteFrontendPdf. Export a quote to PDF.
 * Requires either B2B or BC Token.
 */
export type QuotePdfExport = {
  __typename?: 'QuotePdfExport';
  url?: Maybe<Scalars['String']['output']>;
};

export type QuoteSwitchConfigType = {
  __typename?: 'QuoteSwitchConfigType';
  /** Is enabled for a config */
  isEnabled?: Maybe<Scalars['String']['output']>;
  /** key of a config */
  key?: Maybe<Scalars['String']['output']>;
};

export type QuoteType = Node & {
  __typename?: 'QuoteType';
  allowCheckout?: Maybe<Scalars['Boolean']['output']>;
  /** Backend attach files of the quote */
  backendAttachFiles?: Maybe<Array<Maybe<QuoteAttachFiles>>>;
  bcCustomerId?: Maybe<Scalars['Int']['output']>;
  /** BC order ID of the quote */
  bcOrderId?: Maybe<Scalars['String']['output']>;
  /** Billing address of the quote */
  billingAddress?: Maybe<Scalars['GenericScalar']['output']>;
  cartId?: Maybe<Scalars['String']['output']>;
  cartUrl?: Maybe<Scalars['String']['output']>;
  /** The channel id of the quote */
  channelId?: Maybe<Scalars['Int']['output']>;
  /** The channel name of the quote */
  channelName?: Maybe<Scalars['String']['output']>;
  checkoutUrl?: Maybe<Scalars['String']['output']>;
  /** Company name of the quote */
  company?: Maybe<Scalars['String']['output']>;
  companyId?: Maybe<CompanyType>;
  /** Company information */
  companyInfo?: Maybe<CompanyInfoType>;
  /** Contact info of the quote */
  contactInfo?: Maybe<Scalars['GenericScalar']['output']>;
  createdAt: Scalars['Int']['output'];
  /** Created by user of the quote */
  createdBy?: Maybe<Scalars['String']['output']>;
  createdByEmail?: Maybe<Scalars['String']['output']>;
  /** Currency information of the quote */
  currency?: Maybe<Scalars['GenericScalar']['output']>;
  customerStatus: Scalars['Int']['output'];
  /** discount amount of the quote */
  discount?: Maybe<Scalars['String']['output']>;
  /** Discount type of the quote */
  discountType?: Maybe<Scalars['Int']['output']>;
  /** Discount value of the quote */
  discountValue?: Maybe<Scalars['String']['output']>;
  displayDiscount?: Maybe<Scalars['Boolean']['output']>;
  expiredAt?: Maybe<Scalars['Int']['output']>;
  /** Extra fields of the quote */
  extraFields?: Maybe<Array<Maybe<QuoteExtraFieldsValueType>>>;
  /** Grand total amount of the quote */
  grandTotal?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** Legal terms of the quote */
  legalTerms?: Maybe<Scalars['String']['output']>;
  /** Notes of the quote */
  notes?: Maybe<Scalars['String']['output']>;
  oldCustomerStatus?: Maybe<Scalars['Int']['output']>;
  oldSalesRepStatus?: Maybe<Scalars['Int']['output']>;
  /** order ID of the quote */
  orderId?: Maybe<Scalars['String']['output']>;
  pdfLang?: Maybe<Scalars['String']['output']>;
  pdfTemplate?: Maybe<Scalars['String']['output']>;
  /** Products list of the quote */
  productsList?: Maybe<Array<Maybe<ProductType>>>;
  /** logo of the quote */
  quoteLogo?: Maybe<Scalars['String']['output']>;
  /** Quote number */
  quoteNumber?: Maybe<Scalars['String']['output']>;
  /** Title of the quote */
  quoteTitle?: Maybe<Scalars['String']['output']>;
  /** url of the quote */
  quoteUrl?: Maybe<Scalars['String']['output']>;
  /** Recipients of the quote */
  recipients?: Maybe<Scalars['GenericScalar']['output']>;
  /** Reference number of a quote */
  referenceNumber?: Maybe<Scalars['String']['output']>;
  /** Sales Rep name of the quote */
  salesRep?: Maybe<Scalars['String']['output']>;
  /** Sales Rep email of the quote */
  salesRepEmail?: Maybe<Scalars['String']['output']>;
  /** Sales rep information */
  salesRepInfo?: Maybe<SalesRepInfoType>;
  salesRepStatus: Scalars['Int']['output'];
  /** Shipping address of the quote */
  shippingAddress?: Maybe<Scalars['GenericScalar']['output']>;
  /** Shipping method of the quote */
  shippingMethod?: Maybe<Scalars['GenericScalar']['output']>;
  /** Shipping total of the quote */
  shippingTotal?: Maybe<Scalars['String']['output']>;
  /** Status of the quote */
  status?: Maybe<Scalars['Int']['output']>;
  /** Store information */
  storeInfo?: Maybe<StoreInfoType>;
  /** Storefront attach files of the quote */
  storefrontAttachFiles?: Maybe<Array<Maybe<QuoteAttachFiles>>>;
  /** subtotal amount of the quote */
  subtotal?: Maybe<Scalars['String']['output']>;
  /** total tax amount of the quote */
  taxTotal?: Maybe<Scalars['String']['output']>;
  /** total amount of the quote */
  totalAmount?: Maybe<Scalars['String']['output']>;
  /** Tracking history of the quote */
  trackingHistory?: Maybe<Scalars['GenericScalar']['output']>;
  updatedAt: Scalars['Int']['output'];
  userEmail?: Maybe<Scalars['String']['output']>;
};

export type QuoteTypeCountableConnection = {
  __typename?: 'QuoteTypeCountableConnection';
  edges: Array<QuoteTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type QuoteTypeCountableEdge = {
  __typename?: 'QuoteTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: QuoteType;
};

/**
 * Update a Quote.
 * Requires either B2B or BC Token.
 */
export type QuoteUpdate = {
  __typename?: 'QuoteUpdate';
  quote?: Maybe<QuoteType>;
};

export type QuoteUpdateInputType = {
  /** last message timestamp */
  lastMessage?: InputMaybe<Scalars['Int']['input']>;
  /** Text info from comments */
  message?: InputMaybe<Scalars['String']['input']>;
  /** Store hash */
  storeHash: Scalars['String']['input'];
  /** User email */
  userEmail: Scalars['String']['input'];
};

export type ReceiptLinesType = Node & {
  __typename?: 'ReceiptLinesType';
  /** The amount of receipt lines.Required */
  amount?: Maybe<Scalars['GenericScalar']['output']>;
  amountCode?: Maybe<Scalars['String']['output']>;
  /** The create at of receipt lines.Required */
  createdAt?: Maybe<Scalars['Int']['output']>;
  /** The customer id of receipt lines.Required */
  customerId?: Maybe<Scalars['Int']['output']>;
  /** The external customer id of receipt lines */
  externalCustomerId?: Maybe<Scalars['Int']['output']>;
  /** The external id of receipt lines */
  externalId?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  /** The invoice id of receipt lines.Required */
  invoiceId?: Maybe<Scalars['Int']['output']>;
  /** The invoice number of receipt lines.Required */
  invoiceNumber?: Maybe<Scalars['String']['output']>;
  /** The payment id of receipt lines.Required */
  paymentId?: Maybe<Scalars['Int']['output']>;
  /** The payment status of receipt lines.Required */
  paymentStatus?: Maybe<Scalars['Int']['output']>;
  /** The payment type of receipt lines.Required */
  paymentType?: Maybe<Scalars['String']['output']>;
  /** The id of receipt lines.Required */
  receiptId?: Maybe<Scalars['Int']['output']>;
  /** The reference number of receipt lines.Required */
  referenceNumber?: Maybe<Scalars['String']['output']>;
  /** The store hash of store.Required */
  storeHash?: Maybe<Scalars['String']['output']>;
  /** The transaction type of receipt lines.Required */
  transactionType?: Maybe<Scalars['String']['output']>;
  /** The update at of receipt lines.Required */
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type ReceiptLinesTypeCountableConnection = {
  __typename?: 'ReceiptLinesTypeCountableConnection';
  edges: Array<ReceiptLinesTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type ReceiptLinesTypeCountableEdge = {
  __typename?: 'ReceiptLinesTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: ReceiptLinesType;
};

export type ReceiptType = Node & {
  __typename?: 'ReceiptType';
  /** The create at of receipt.Required */
  createdAt?: Maybe<Scalars['Int']['output']>;
  /** The customer id of receipt.Required */
  customerId?: Maybe<Scalars['Int']['output']>;
  /** The details of receipt */
  details?: Maybe<Scalars['GenericScalar']['output']>;
  /** The external customer id of receipt */
  externalCustomerId?: Maybe<Scalars['Int']['output']>;
  /** The external id of receipt */
  externalId?: Maybe<Scalars['Int']['output']>;
  id: Scalars['ID']['output'];
  /** The payer customer id of receipt.Required */
  payerCustomerId?: Maybe<Scalars['String']['output']>;
  /** The payer name of receipt.Required */
  payerName?: Maybe<Scalars['String']['output']>;
  /** The payment id of receipt.Required */
  paymentId?: Maybe<Scalars['Int']['output']>;
  paymentType?: Maybe<Scalars['String']['output']>;
  receiptLineSet: ReceiptLinesTypeCountableConnection;
  /** The reference number of receipt.Required */
  referenceNumber?: Maybe<Scalars['String']['output']>;
  /** The store hash of store.Required */
  storeHash?: Maybe<Scalars['String']['output']>;
  /** The total of receipt.Required */
  total?: Maybe<Scalars['GenericScalar']['output']>;
  totalAmount?: Maybe<Scalars['Decimal']['output']>;
  totalCode?: Maybe<Scalars['String']['output']>;
  /** The transaction type of receipt.Required */
  transactionType?: Maybe<Scalars['String']['output']>;
  /** The update at of receipt.Required */
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type ReceiptTypeReceiptLineSetArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  invoiceId?: InputMaybe<Scalars['String']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type ReceiptTypeCountableConnection = {
  __typename?: 'ReceiptTypeCountableConnection';
  edges: Array<ReceiptTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type ReceiptTypeCountableEdge = {
  __typename?: 'ReceiptTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: ReceiptType;
};

export type ReferenceRequestType = {
  __typename?: 'ReferenceRequestType';
  /** The option configuration of the product (optional); might be partially configured for estimates. */
  options?: Maybe<Array<Maybe<PricingProductItemOptionsType>>>;
  /** The (required) product ID of the item. */
  productId: Scalars['Int']['output'];
  /** The (optional) variant ID of the item. */
  variantId?: Maybe<Scalars['Int']['output']>;
};

export type ShippingAddressInputType = {
  address?: InputMaybe<Scalars['String']['input']>;
  addressId?: InputMaybe<Scalars['Int']['input']>;
  addressLine1?: InputMaybe<Scalars['String']['input']>;
  addressLine2?: InputMaybe<Scalars['String']['input']>;
  apartment?: InputMaybe<Scalars['String']['input']>;
  city?: InputMaybe<Scalars['String']['input']>;
  companyName?: InputMaybe<Scalars['String']['input']>;
  country?: InputMaybe<Scalars['String']['input']>;
  extraFields?: InputMaybe<Array<InputMaybe<QuoteAddressExtraFieldsInputType>>>;
  firstName?: InputMaybe<Scalars['String']['input']>;
  label?: InputMaybe<Scalars['String']['input']>;
  lastName?: InputMaybe<Scalars['String']['input']>;
  phoneNumber?: InputMaybe<Scalars['String']['input']>;
  shippingCity?: InputMaybe<Scalars['String']['input']>;
  shippingZipCode?: InputMaybe<Scalars['String']['input']>;
  state?: InputMaybe<Scalars['String']['input']>;
  zipCode?: InputMaybe<Scalars['String']['input']>;
};

export type ShippingMethodInputType = {
  additionalDescription: Scalars['String']['input'];
  cost: Scalars['Float']['input'];
  description: Scalars['String']['input'];
  id: Scalars['String']['input'];
  imageUrl: Scalars['String']['input'];
  transitTime: Scalars['String']['input'];
  type: Scalars['String']['input'];
};

export type ShoppingListIdNameType = Node & {
  __typename?: 'ShoppingListIdNameType';
  id: Scalars['ID']['output'];
  name?: Maybe<Scalars['String']['output']>;
  status: Scalars['Int']['output'];
};

export type ShoppingListItem = Node & {
  __typename?: 'ShoppingListItem';
  /** Product base price */
  basePrice?: Maybe<Scalars['String']['output']>;
  /** Product base SKU */
  baseSku?: Maybe<Scalars['String']['output']>;
  /** The created timestamp of the shopping list */
  createdAt?: Maybe<Scalars['Int']['output']>;
  /** Product discount */
  discount?: Maybe<Scalars['String']['output']>;
  /** Product entered inclusive */
  enteredInclusive?: Maybe<Scalars['Boolean']['output']>;
  id: Scalars['ID']['output'];
  /** Shopping list item ID */
  itemId?: Maybe<Scalars['Int']['output']>;
  /** Product option list */
  optionList?: Maybe<Scalars['GenericScalar']['output']>;
  /** Product primary image url */
  primaryImage?: Maybe<Scalars['String']['output']>;
  /** Product ID */
  productId?: Maybe<Scalars['Int']['output']>;
  /** Product name */
  productName?: Maybe<Scalars['String']['output']>;
  /** Product note */
  productNote?: Maybe<Scalars['String']['output']>;
  /** Product url */
  productUrl?: Maybe<Scalars['String']['output']>;
  /** Quantity */
  quantity?: Maybe<Scalars['Int']['output']>;
  sortOrder?: Maybe<Scalars['Int']['output']>;
  /** Product tax */
  tax?: Maybe<Scalars['String']['output']>;
  /** The updated timestamp of the shopping list */
  updatedAt?: Maybe<Scalars['Int']['output']>;
  /** Product variant id */
  variantId?: Maybe<Scalars['Int']['output']>;
  /** SKU name */
  variantSku?: Maybe<Scalars['String']['output']>;
};

export type ShoppingListItemCountableConnection = {
  __typename?: 'ShoppingListItemCountableConnection';
  edges: Array<ShoppingListItemCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type ShoppingListItemCountableEdge = {
  __typename?: 'ShoppingListItemCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: ShoppingListItem;
};

export type ShoppingListPageType = Node & {
  __typename?: 'ShoppingListPageType';
  /** Has the shopping list been submitted for approval */
  approvedFlag?: Maybe<Scalars['Boolean']['output']>;
  /** The channel id of the shopping list */
  channelId?: Maybe<Scalars['Int']['output']>;
  /** The channel name of the shopping list */
  channelName?: Maybe<Scalars['String']['output']>;
  /** The created timestamp of the shopping list */
  createdAt?: Maybe<Scalars['Int']['output']>;
  /** Shopping list customer information */
  customerInfo?: Maybe<CustomerInfo>;
  /** Shopping list description */
  description?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** If owner of shopping list */
  isOwner?: Maybe<Scalars['Boolean']['output']>;
  /** Shopping list name */
  name?: Maybe<Scalars['String']['output']>;
  /** products of shopping list */
  products?: Maybe<BaseShoppingListItemCountableConnection>;
  /** Shopping list reason */
  reason?: Maybe<Scalars['String']['output']>;
  /** Shopping list status. 0: Approved 20: Deleted 30: Draft 40: Ready for approval 50:Rejected */
  status?: Maybe<Scalars['Int']['output']>;
  /** The updated timestamp of the shopping list */
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type ShoppingListPageTypeProductsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

export type ShoppingListPageTypeCountableConnection = {
  __typename?: 'ShoppingListPageTypeCountableConnection';
  edges: Array<ShoppingListPageTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type ShoppingListPageTypeCountableEdge = {
  __typename?: 'ShoppingListPageTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: ShoppingListPageType;
};

export type ShoppingListType = Node & {
  __typename?: 'ShoppingListType';
  /** Has the shopping list been submitted for approval */
  approvedFlag?: Maybe<Scalars['Boolean']['output']>;
  /** The channel id of the shopping list */
  channelId?: Maybe<Scalars['Int']['output']>;
  /** The channel name of the shopping list */
  channelName?: Maybe<Scalars['String']['output']>;
  /** The created timestamp of the shopping list */
  createdAt?: Maybe<Scalars['Int']['output']>;
  /** Shopping list customer information */
  customerInfo?: Maybe<CustomerInfo>;
  /** Shopping list description */
  description?: Maybe<Scalars['String']['output']>;
  /** grand total amount of shopping list */
  grandTotal?: Maybe<Scalars['String']['output']>;
  id: Scalars['ID']['output'];
  /** If owner of shopping list */
  isOwner?: Maybe<Scalars['Boolean']['output']>;
  /** If show grand total amount of shopping list */
  isShowGrandTotal?: Maybe<Scalars['Boolean']['output']>;
  /** Shopping list name */
  name?: Maybe<Scalars['String']['output']>;
  /** products of shopping list */
  products?: Maybe<ShoppingListItemCountableConnection>;
  /** Shopping list reason */
  reason?: Maybe<Scalars['String']['output']>;
  /** Shopping list status. 0: Approved 20: Deleted 30: Draft 40: Ready for approval 50:Rejected */
  status?: Maybe<Scalars['Int']['output']>;
  /** Total discount of shopping list */
  totalDiscount?: Maybe<Scalars['String']['output']>;
  /** Total tax of shopping list */
  totalTax?: Maybe<Scalars['String']['output']>;
  /** The updated timestamp of the shopping list */
  updatedAt?: Maybe<Scalars['Int']['output']>;
};

export type ShoppingListTypeProductsArgs = {
  after?: InputMaybe<Scalars['String']['input']>;
  before?: InputMaybe<Scalars['String']['input']>;
  first?: InputMaybe<Scalars['Int']['input']>;
  last?: InputMaybe<Scalars['Int']['input']>;
  offset?: InputMaybe<Scalars['Int']['input']>;
  orderBy?: InputMaybe<Scalars['String']['input']>;
  search?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Create a shopping list.
 * Requires a B2B Token.
 */
export type ShoppingListsCreate = {
  __typename?: 'ShoppingListsCreate';
  shoppingList?: Maybe<ShoppingListType>;
};

/**
 * Delete a shopping list.
 * Requires a B2B Token.
 */
export type ShoppingListsDelete = {
  __typename?: 'ShoppingListsDelete';
  message?: Maybe<Scalars['String']['output']>;
};

/**
 * Duplicate a shopping list.
 * Requires a B2B Token.
 */
export type ShoppingListsDuplicate = {
  __typename?: 'ShoppingListsDuplicate';
  shoppingList?: Maybe<ShoppingListType>;
};

export type ShoppingListsDuplicateInputType = {
  description: Scalars['String']['input'];
  name: Scalars['String']['input'];
};

export type ShoppingListsInputType = {
  /** Shopping list description */
  description: Scalars['String']['input'];
  /** Shopping list name */
  name: Scalars['String']['input'];
  /** 0: Approved 20: Deleted 30: Draft 40: Ready for approval 50:Rejected */
  status: Scalars['Int']['input'];
};

/**
 * Add items to an existed shopping list.
 * Requires a B2B Token.
 */
export type ShoppingListsItemsCreate = {
  __typename?: 'ShoppingListsItemsCreate';
  shoppingListsItems?: Maybe<Array<Maybe<ShoppingListItem>>>;
};

/**
 * Delete shopping list item using shoppingListId and itemId.
 * Requires a B2B Token.
 */
export type ShoppingListsItemsDelete = {
  __typename?: 'ShoppingListsItemsDelete';
  message?: Maybe<Scalars['String']['output']>;
};

export type ShoppingListsItemsInputType = {
  /** Product option of shopping list item */
  optionList?: InputMaybe<Array<InputMaybe<ShoppingListsItemsOptionInputType>>>;
  /** Product ID */
  productId: Scalars['Int']['input'];
  /** Product note */
  productNote?: InputMaybe<Scalars['String']['input']>;
  /** Quantity of product in shopping list */
  quantity: Scalars['ProductQuantity']['input'];
  /** Sort order */
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  /** Product SKU ID */
  variantId: Scalars['Int']['input'];
};

export type ShoppingListsItemsOptionInputType = {
  optionId: Scalars['String']['input'];
  optionValue: Scalars['GenericScalar']['input'];
};

/**
 * Update shopping lists items.
 * Requires a B2B Token.
 */
export type ShoppingListsItemsUpdate = {
  __typename?: 'ShoppingListsItemsUpdate';
  shoppingListsItem?: Maybe<ShoppingListItem>;
};

export type ShoppingListsItemsUpdateInputType = {
  /** Product option of shopping list item */
  optionList?: InputMaybe<Array<InputMaybe<ShoppingListsItemsOptionInputType>>>;
  /** Product note */
  productNote?: InputMaybe<Scalars['String']['input']>;
  /** Quantity of product in shopping list */
  quantity?: InputMaybe<Scalars['ProductQuantity']['input']>;
  /** Sort order */
  sortOrder?: InputMaybe<Scalars['Int']['input']>;
  /** Product SKU ID */
  variantId?: InputMaybe<Scalars['Int']['input']>;
};

/**
 * Update a shopping list.
 * Requires a B2B Token.
 */
export type ShoppingListsUpdate = {
  __typename?: 'ShoppingListsUpdate';
  shoppingList?: Maybe<ShoppingListType>;
};

export type StatesType = {
  __typename?: 'StatesType';
  /** The state iso2 code */
  stateCode?: Maybe<Scalars['String']['output']>;
  /** The state name */
  stateName?: Maybe<Scalars['String']['output']>;
};

export type StoreAutoLoaderType = {
  __typename?: 'StoreAutoLoaderType';
  /** The checkout ulr of auto loader */
  checkoutUrl?: Maybe<Scalars['String']['output']>;
  /** The storefront ulr of auto loader */
  storefrontUrl?: Maybe<Scalars['String']['output']>;
};

export type StoreBasicInfoType = {
  __typename?: 'StoreBasicInfoType';
  /** Whether multi storefront is enabled or not */
  multiStorefrontEnabled?: Maybe<Scalars['Boolean']['output']>;
  storeAddress?: Maybe<Scalars['String']['output']>;
  storeCountry?: Maybe<Scalars['String']['output']>;
  storeLogo?: Maybe<Scalars['String']['output']>;
  storeName?: Maybe<Scalars['String']['output']>;
  /** The store sites of store */
  storeSites?: Maybe<Array<Maybe<StoreSitesType>>>;
  storeUrl?: Maybe<Scalars['String']['output']>;
  timeFormat?: Maybe<StoreTimeFormatType>;
};

export type StoreConfigType = {
  __typename?: 'StoreConfigType';
  /** The id of store config.Required */
  id?: Maybe<Scalars['String']['output']>;
  /** The enabled of store config.Required */
  isEnabled?: Maybe<Scalars['String']['output']>;
  /** The key of store config.Required */
  key?: Maybe<Scalars['String']['output']>;
};

export type StoreCurrencies = {
  __typename?: 'StoreCurrencies';
  /** channel currencies options list */
  channelCurrencies?: Maybe<Scalars['GenericScalar']['output']>;
  currencies?: Maybe<Array<Maybe<Currencies>>>;
  enteredInclusiveTax?: Maybe<Scalars['Boolean']['output']>;
};

export type StoreFrontConfigType = {
  __typename?: 'StoreFrontConfigType';
  /** The config of store config.Required */
  config?: Maybe<StoreFrontConfigsType>;
  /** The id of storefront config.Required */
  configId?: Maybe<Scalars['Int']['output']>;
};

export type StoreFrontConfigsType = {
  __typename?: 'StoreFrontConfigsType';
  /** The account settings config of storefront.True is enable,False id disabled.Required */
  accountSettings?: Maybe<Scalars['Boolean']['output']>;
  /** The address book config of storefront.True is enable,False id disabled.Required */
  addressBook?: Maybe<Scalars['Boolean']['output']>;
  /** The buy again  config of storefront.True is enable,False id disabled.Required */
  buyAgain?: Maybe<Scalars['Boolean']['output']>;
  /** The dashboard  config of storefront.True is enable,False id disabled.Required */
  dashboard?: Maybe<Scalars['Boolean']['output']>;
  /** The invoice config of storefront.True is enable,False id disabled.Required */
  invoice?: Maybe<StoreFrontInvoiceConfigType>;
  /** The message config of storefront.True is enable,False id disabled.Required */
  messages?: Maybe<Scalars['Boolean']['output']>;
  /** The orders config of storefront.True is enable,False id disabled.Required */
  orders?: Maybe<Scalars['Boolean']['output']>;
  /** The quick order pad config of storefront.True is enable,False id disabled.Required */
  quickOrderPad?: Maybe<Scalars['Boolean']['output']>;
  /** The quotes config of storefront.True is enable,False id disabled.Required */
  quotes?: Maybe<Scalars['Boolean']['output']>;
  /** The recently viewed config of storefront.True is enable,False id disabled.Required */
  recentlyViewed?: Maybe<Scalars['Boolean']['output']>;
  /** The returns config of storefront.True is enable,False id disabled.Required */
  returns?: Maybe<Scalars['Boolean']['output']>;
  /** The shopping lists  config of storefront.True is enable,False id disabled.Required */
  shoppingLists?: Maybe<Scalars['Boolean']['output']>;
  /** The tpa config of storefront.True is enable,False id disabled.Required */
  tradeProfessionalApplication?: Maybe<Scalars['Boolean']['output']>;
  /** The user management  config of storefront.True is enable,False id disabled.Required */
  userManagement?: Maybe<Scalars['Boolean']['output']>;
  /** The wish lists  config of storefront.True is enable,False id disabled.Required */
  wishLists?: Maybe<Scalars['Boolean']['output']>;
};

export type StoreFrontInvoiceConfigType = {
  __typename?: 'StoreFrontInvoiceConfigType';
  /** The enabled status of store invoice config.Required */
  enabledStatus?: Maybe<Scalars['Boolean']['output']>;
  /** The value of store invoice config.Required */
  value?: Maybe<Scalars['Boolean']['output']>;
};

export type StoreInfoType = {
  __typename?: 'StoreInfoType';
  storeAddress?: Maybe<Scalars['String']['output']>;
  storeCountry?: Maybe<Scalars['String']['output']>;
  storeLogo?: Maybe<Scalars['String']['output']>;
  storeName?: Maybe<Scalars['String']['output']>;
  storeUrl?: Maybe<Scalars['String']['output']>;
};

export type StoreLimitationsType = {
  __typename?: 'StoreLimitationsType';
  /** The can create of store limitations */
  canCreate?: Maybe<Scalars['Boolean']['output']>;
  /** Whether has limitation of store */
  hasLimitation?: Maybe<Scalars['Boolean']['output']>;
  /** The limitation  count of store limitations */
  limitationCount?: Maybe<Scalars['Int']['output']>;
  /** The limitation  type of store limitations */
  limitationType?: Maybe<Scalars['Int']['output']>;
  /** The limitation  type name of store limitations */
  limitationTypeName?: Maybe<Scalars['String']['output']>;
  /** The resource count of store limitations */
  resourceCount?: Maybe<Scalars['Int']['output']>;
};

export type StoreSitesType = {
  __typename?: 'StoreSitesType';
  /** The channel is enabled in B2B Edition or not */
  b2bEnabled?: Maybe<Scalars['Boolean']['output']>;
  /** The id of store channel in B2B Edition */
  b3ChannelId?: Maybe<Scalars['Int']['output']>;
  /** The id of store channel in BC */
  channelId?: Maybe<Scalars['Int']['output']>;
  /** The logo of channel configured in B2B Edition */
  channelLogo?: Maybe<Scalars['String']['output']>;
  /** The icon of store channel */
  iconUrl?: Maybe<Scalars['String']['output']>;
  /** The channel is enabled in BC or not */
  isEnabled?: Maybe<Scalars['Boolean']['output']>;
  /** The name of the platform for the channel */
  platform?: Maybe<Scalars['String']['output']>;
  /** Version of current translation document */
  translationVersion?: Maybe<Scalars['Int']['output']>;
  /** The type of store channel */
  type?: Maybe<Scalars['String']['output']>;
  /** The urls of store channel */
  urls?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type StoreTimeFormatType = {
  __typename?: 'StoreTimeFormatType';
  /** string that defines dates’ display format */
  display?: Maybe<Scalars['String']['output']>;
  /** string that defines the CSV export format for orders, customers, and products */
  export?: Maybe<Scalars['String']['output']>;
  /** string that defines dates’ extended-display format */
  extendedDisplay?: Maybe<Scalars['String']['output']>;
  /** negative or positive number, identifying the offset from UTC/GMT */
  offset?: Maybe<Scalars['Int']['output']>;
};

export type StoreUserInfo = {
  __typename?: 'StoreUserInfo';
  companyInfo?: Maybe<CompanyInfoType>;
  salesRepInfo?: Maybe<SalesRepInfoType>;
  storeInfo?: Maybe<StoreInfoType>;
};

export type StorefrontConfigType = {
  __typename?: 'StorefrontConfigType';
  /** detail data of the config */
  extraFields?: Maybe<Scalars['GenericScalar']['output']>;
  /** The key of the config */
  key?: Maybe<Scalars['String']['output']>;
  /** The value of the config */
  value?: Maybe<Scalars['String']['output']>;
};

export type StorefrontLanguageType = {
  __typename?: 'StorefrontLanguageType';
  language?: Maybe<Scalars['String']['output']>;
};

export type StorefrontProductSettingType = {
  __typename?: 'StorefrontProductSettingType';
  defaultPreorderMessage?: Maybe<Scalars['String']['output']>;
  hidePriceFromGuests?: Maybe<Scalars['Boolean']['output']>;
  showAddToCartLink?: Maybe<Scalars['Boolean']['output']>;
  showAddToCartQtyBox?: Maybe<Scalars['Boolean']['output']>;
  showAddToWishlist?: Maybe<Scalars['Boolean']['output']>;
  showBreadcrumbsProductPages?: Maybe<Scalars['String']['output']>;
  showProductBrand?: Maybe<Scalars['Boolean']['output']>;
  showProductPrice?: Maybe<Scalars['Boolean']['output']>;
  showProductRating?: Maybe<Scalars['Boolean']['output']>;
  showProductShipping?: Maybe<Scalars['Boolean']['output']>;
  showProductSku?: Maybe<Scalars['Boolean']['output']>;
  showProductWeight?: Maybe<Scalars['Boolean']['output']>;
};

export type StorefrontScriptType = {
  __typename?: 'StorefrontScriptType';
  channelId?: Maybe<Scalars['Int']['output']>;
  script?: Maybe<Scalars['String']['output']>;
  storeHash?: Maybe<Scalars['String']['output']>;
};

export type SuperAdminBeginMasquerade = {
  __typename?: 'SuperAdminBeginMasquerade';
  userInfo?: Maybe<UserInfoType>;
};

export type SuperAdminCompanyExtraFieldsValueType = {
  __typename?: 'SuperAdminCompanyExtraFieldsValueType';
  fieldName?: Maybe<Scalars['String']['output']>;
  fieldValue?: Maybe<Scalars['String']['output']>;
};

export type SuperAdminCompanyType = Node & {
  __typename?: 'SuperAdminCompanyType';
  /** Company BC customer group name */
  bcGroupName?: Maybe<Scalars['String']['output']>;
  /** Admin user name of the company */
  companyAdminName?: Maybe<Scalars['String']['output']>;
  /** Email of the company */
  companyEmail?: Maybe<Scalars['String']['output']>;
  /** Company ID of the company */
  companyId?: Maybe<Scalars['Int']['output']>;
  /** Company name */
  companyName?: Maybe<Scalars['String']['output']>;
  /** Extra field list of the company */
  extraFields?: Maybe<Array<Maybe<SuperAdminCompanyExtraFieldsValueType>>>;
  /** The ID of the object */
  id: Scalars['ID']['output'];
};

export type SuperAdminCompanyTypeCountableConnection = {
  __typename?: 'SuperAdminCompanyTypeCountableConnection';
  edges: Array<SuperAdminCompanyTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type SuperAdminCompanyTypeCountableEdge = {
  __typename?: 'SuperAdminCompanyTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: SuperAdminCompanyType;
};

/**
 * Super admin end masquerade,
 * Requires a B2B Token.
 */
export type SuperAdminEndMasquerade = {
  __typename?: 'SuperAdminEndMasquerade';
  message?: Maybe<Scalars['String']['output']>;
};

export type TaxClassRateType = {
  __typename?: 'TaxClassRateType';
  /** The rate of tax class */
  rate?: Maybe<Scalars['Float']['output']>;
  /** The id of tax class */
  taxClassId?: Maybe<Scalars['Int']['output']>;
};

export type TaxRateType = {
  __typename?: 'TaxRateType';
  /** The class rates of tax rate */
  classRates?: Maybe<Array<Maybe<TaxClassRateType>>>;
  /** The enabled of tax rate */
  enabled?: Maybe<Scalars['Boolean']['output']>;
  /** The id of tax rate */
  id?: Maybe<Scalars['Int']['output']>;
  /** The name of tax rate */
  name?: Maybe<Scalars['String']['output']>;
  /** The priority of tax rate */
  priority?: Maybe<Scalars['Int']['output']>;
};

export type TaxZoneRateType = {
  __typename?: 'TaxZoneRateType';
  /** The enabled of tax zone */
  enabled?: Maybe<Scalars['Boolean']['output']>;
  /** The id of tax zone */
  id?: Maybe<Scalars['Int']['output']>;
  /** The name of tax zone */
  name?: Maybe<Scalars['String']['output']>;
  /** Store displays prices to shoppers matched with this tax zone. */
  priceDisplaySettings?: Maybe<PriceDisplaySettingsType>;
  rates?: Maybe<Array<Maybe<TaxRateType>>>;
  /** The shopper target settings of tax zone */
  shopperTargetSettings?: Maybe<TaxZoneShopperTargetType>;
};

export type TaxZoneShopperTargetLocationType = {
  __typename?: 'TaxZoneShopperTargetLocationType';
  /** The country code */
  countryCode?: Maybe<Scalars['String']['output']>;
  /** The postal codes */
  postalCodes?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
  /** The subdivision codes */
  subdivisionCodes?: Maybe<Array<Maybe<Scalars['String']['output']>>>;
};

export type TaxZoneShopperTargetType = {
  __typename?: 'TaxZoneShopperTargetType';
  /** The customer group id list */
  customerGroups?: Maybe<Array<Maybe<Scalars['Int']['output']>>>;
  locations?: Maybe<Array<Maybe<TaxZoneShopperTargetLocationType>>>;
};

/**
 * Update Account Settings.
 * Requires a B2B Token.
 */
export type UpdateAccount = {
  __typename?: 'UpdateAccount';
  result?: Maybe<AccountSettingType>;
};

/**
 * Update Customer Account Settings.
 * Requires a BC Token.
 */
export type UpdateCustomerAccount = {
  __typename?: 'UpdateCustomerAccount';
  result?: Maybe<CustomerAccountSettingsType>;
};

export type UserAuthResultType = {
  __typename?: 'UserAuthResultType';
  /** The user's login type */
  loginType?: Maybe<Scalars['Int']['output']>;
  /** The user's permissions */
  permissions?: Maybe<Array<Maybe<AuthRolePermissionType>>>;
  /** BigCommerce Storefront login token */
  storefrontLoginToken?: Maybe<Scalars['String']['output']>;
  /** The B2B Edition token */
  token?: Maybe<Scalars['String']['output']>;
  /** The user info */
  user?: Maybe<UserType>;
};

export type UserAuthType = {
  /** The Bigcommerce token */
  bcToken: Scalars['String']['input'];
  /** The Bigcommerce channel id */
  channelId?: InputMaybe<Scalars['Int']['input']>;
};

/** Authorize using a Bigcommerce token. */
export type UserAuthorization = {
  __typename?: 'UserAuthorization';
  result?: Maybe<UserAuthResultType>;
};

/**
 * Login to checkout for a given cart.
 * Requires a B2B token.
 */
export type UserCheckoutLogin = {
  __typename?: 'UserCheckoutLogin';
  result?: Maybe<CheckoutResultLoginType>;
};

/**
 * Create a company user.
 * Requires a B2B Token.
 */
export type UserCreate = {
  __typename?: 'UserCreate';
  user?: Maybe<UserType>;
};

/**
 * Delete a company user.
 * Requires a B2B Token.
 */
export type UserDelete = {
  __typename?: 'UserDelete';
  message?: Maybe<Scalars['String']['output']>;
};

export type UserEmailCheckInfoType = {
  __typename?: 'UserEmailCheckInfoType';
  /** Company name */
  companyName?: Maybe<Scalars['String']['output']>;
  /** User email */
  email?: Maybe<Scalars['String']['output']>;
  /** User first name */
  firstName?: Maybe<Scalars['String']['output']>;
  /** Is user's password reset on login */
  forcePasswordReset?: Maybe<Scalars['Boolean']['output']>;
  /** User id */
  id?: Maybe<Scalars['Int']['output']>;
  /** User last name */
  lastName?: Maybe<Scalars['String']['output']>;
  /** Origin BC channel id */
  originChannelId?: Maybe<Scalars['Int']['output']>;
  /** Phone number */
  phoneNumber?: Maybe<Scalars['String']['output']>;
  /** User role */
  role?: Maybe<Scalars['Int']['output']>;
};

export type UserEmailCheckType = {
  __typename?: 'UserEmailCheckType';
  userInfo?: Maybe<UserEmailCheckInfoType>;
  /** 1: not exist; 2: exist in BC; 3: exist more than one in BC; 4: exist in B3 other company; 5: exist in B3 current company; 6: exist in B3 as super admin; 7: exist in B3 current company other channel; */
  userType?: Maybe<Scalars['Int']['output']>;
};

export type UserExtraField = {
  fieldName: Scalars['String']['input'];
  fieldValue: Scalars['String']['input'];
};

export type UserExtraFieldsValueType = {
  __typename?: 'UserExtraFieldsValueType';
  /** The field name of extra field */
  fieldName?: Maybe<Scalars['String']['output']>;
  /** The field value of extra field */
  fieldValue?: Maybe<Scalars['String']['output']>;
};

export type UserInfoType = {
  __typename?: 'UserInfoType';
  email?: Maybe<Scalars['String']['output']>;
  firstName?: Maybe<Scalars['String']['output']>;
  lastName?: Maybe<Scalars['String']['output']>;
  phoneNumber?: Maybe<Scalars['String']['output']>;
};

export type UserInputType = {
  /**
   * Send welcome email to user.
   * True or False
   */
  acceptEmail?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * Used for MSF store.
   * Add current channel to user if email exists.
   */
  addChannel?: InputMaybe<Scalars['Boolean']['input']>;
  /**
   * The id of the company.
   * This field is required
   */
  companyId: Scalars['Int']['input'];
  /** User company role id. */
  companyRoleId?: InputMaybe<Scalars['Int']['input']>;
  /**
   * User email.
   * This field is required
   */
  email: Scalars['String']['input'];
  /** user extra fields */
  extraFields?: InputMaybe<Array<InputMaybe<UserExtraField>>>;
  /**
   * User first name.
   * This field is required
   */
  firstName: Scalars['String']['input'];
  /**
   * User last name.
   * This field is required
   */
  lastName: Scalars['String']['input'];
  /** User phone number */
  phone?: InputMaybe<Scalars['String']['input']>;
  /**
   * User role.
   * (0-Admin, 1-Senior Buyer, 2-Junior Buyer).
   */
  role?: InputMaybe<Scalars['Int']['input']>;
  /** The uuid of user */
  uuid?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Login to a store with Bigcommerce user email and password.
 * Doesn't require a Token.
 */
export type UserLogin = {
  __typename?: 'UserLogin';
  result?: Maybe<UserAuthResultType>;
};

export type UserLoginType = {
  /** The Bigcommerce channel id */
  channelId?: InputMaybe<Scalars['Int']['input']>;
  /** The Bigcommerce user email. Required */
  email: Scalars['String']['input'];
  /** The Bigcommerce password. Required */
  password: Scalars['String']['input'];
  /** Redirect URL for storefront login token */
  redirectUrl?: InputMaybe<Scalars['String']['input']>;
  /** The store hash of Bigcommerce store. Required */
  storeHash: Scalars['String']['input'];
};

/**
 * Creates a Storefront API token.
 * Doesn't require a Token.
 */
export type UserStoreFrontToken = {
  __typename?: 'UserStoreFrontToken';
  token?: Maybe<Scalars['String']['output']>;
};

export type UserType = Node & {
  __typename?: 'UserType';
  bcId: Scalars['Int']['output'];
  /** User company role */
  companyRoleId?: Maybe<Scalars['Int']['output']>;
  /** User company role name */
  companyRoleName?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['Int']['output'];
  email: Scalars['String']['output'];
  /** extra fields of this user */
  extraFields?: Maybe<Array<Maybe<UserExtraFieldsValueType>>>;
  firstName: Scalars['String']['output'];
  id: Scalars['ID']['output'];
  lastName: Scalars['String']['output'];
  phone?: Maybe<Scalars['String']['output']>;
  role: Scalars['Int']['output'];
  updatedAt: Scalars['Int']['output'];
  /** The uuid of user */
  uuid?: Maybe<Scalars['String']['output']>;
};

export type UserTypeCountableConnection = {
  __typename?: 'UserTypeCountableConnection';
  edges: Array<UserTypeCountableEdge>;
  /** Pagination data for this connection. */
  pageInfo: PageInfo;
  /** A total count of items in the collection. */
  totalCount?: Maybe<Scalars['Int']['output']>;
};

export type UserTypeCountableEdge = {
  __typename?: 'UserTypeCountableEdge';
  /** A cursor for use in pagination. */
  cursor: Scalars['String']['output'];
  /** The item at the end of the edge. */
  node: UserType;
};

/**
 * Update a company user.
 * Requires a B2B Token.
 */
export type UserUpdate = {
  __typename?: 'UserUpdate';
  user?: Maybe<UserType>;
};

export type UserUpdateInputType = {
  /**
   * The id of company.
   * This field is required.
   */
  companyId: Scalars['Int']['input'];
  /** User company role */
  companyRoleId?: InputMaybe<Scalars['Int']['input']>;
  /** user extra fields */
  extraFields?: InputMaybe<Array<InputMaybe<UserExtraField>>>;
  /** User first name */
  firstName?: InputMaybe<Scalars['String']['input']>;
  /** User last name */
  lastName?: InputMaybe<Scalars['String']['input']>;
  /** User phone number */
  phone?: InputMaybe<Scalars['String']['input']>;
  /**
   * User role.
   * (0-Admin, 1-Senior Buyer, 2-Junior Buyer).
   */
  role?: InputMaybe<Scalars['Int']['input']>;
  /**
   * The id of user.
   * This field is required.
   */
  userId: Scalars['Int']['input'];
  /** The uuid of user */
  uuid?: InputMaybe<Scalars['String']['input']>;
};

/**
 * Download invoice pdf file by invoice id.
 * Requires a B2B Token.
 */
export type InvoicePdf = {
  __typename?: 'invoicePdf';
  /** The pdf file url */
  url?: Maybe<Scalars['String']['output']>;
};

/**
 * Export invoice csv file.
 * Requires a B2B Token.
 */
export type InvoicesExport = {
  __typename?: 'invoicesExport';
  /** The export file url. */
  url?: Maybe<Scalars['String']['output']>;
};

export type SalesRepInfoType = {
  __typename?: 'salesRepInfoType';
  salesRepEmail?: Maybe<Scalars['String']['output']>;
  salesRepName?: Maybe<Scalars['String']['output']>;
  salesRepPhoneNumber?: Maybe<Scalars['String']['output']>;
};
