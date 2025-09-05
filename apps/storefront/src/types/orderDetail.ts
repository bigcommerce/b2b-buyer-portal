import { Address } from './global';
import { CompanyInfoTypes } from './invoice';

export interface OrderProductOption {
  display_name: string;
  display_name_customer: string;
  display_name_merchant: string;
  display_style: string;
  display_value: string;
  display_value_customer: string;
  display_value_merchant: string;
  id: number;
  name: string;
  option_id: number;
  order_product_id: number;
  product_option_id: number;
  type: string;
  value: string;
}
export interface OrderProductItem {
  base_price: string;
  base_total: string;
  brand: string;
  configurable_fields: string;
  cost_price_ex_tax: string;
  cost_price_inc_tax: string;
  cost_price_tax: string;
  id: number;
  imageUrl: string;
  is_bundled_product: boolean;
  is_refunded: boolean;
  name: string;
  name_customer: string;
  name_merchant: string;
  optionList: {
    optionId: number;
    optionValue: string;
    type: string;
  }[];
  option_set_id: number;
  order_address_id: number;
  order_id: number;
  parent_order_product_id: number;
  price_ex_tax: string;
  price_inc_tax: string;
  price_tax: string;
  product_id: number;
  product_options: OrderProductOption[];
  quantity: number;
  quantity_refunded: number;
  quantity_shipped: number;
  refund_amount: string;
  return_id: number;
  sku: string;
  total_ex_tax: string;
  total_inc_tax: string;
  total_tax: string;
  type: string;
  variant_id: number;
  wrapping_cost_ex_tax: string;
  wrapping_cost_inc_tax: string;
  wrapping_cost_tax: string;
  wrapping_id: number;
  wrapping_message: string;
  wrapping_name: string;
  current_quantity_shipped?: number;
  not_shipping_number?: number;
  variantImageUrl?: string;
  isVisible?: boolean;
}

export interface EditableProductItem extends OrderProductItem {
  editQuantity: number | string;
  helperText?: string;
}

interface OrderShipmentProductItem {
  order_product_id: number;
  product_id: number;
  quantity: number;
}

interface OrderShipmentItem {
  billing_address: Address;
  comments: string;
  customer_id: number;
  date_created: string;
  id: number;
  items: OrderShipmentProductItem[];
  merchant_shipping_cost: string;
  order_address_id: number;
  order_id: number;
  shipping_address: Address;
  shipping_method: string;
  shipping_provider_display_name: string;
  tracking_carrier: string;
  tracking_link: string;
  generated_tracking_link?: string;
  tracking_number: string;
}

export interface OrderShippedItem extends OrderShipmentItem {
  itemsInfo: OrderProductItem[];
}

interface OrderShippingAddressItem extends Address {
  base_cost: string;
  base_handling_cost: string;
  cost_ex_tax: string;
  cost_inc_tax: string;
  cost_tax: string;
  cost_tax_class_id: number;
  handling_cost_ex_tax: string;
  handling_cost_inc_tax: string;
  handling_cost_tax: string;
  handling_cost_tax_class_id: number;
  id: number;
  items_shipped: number;
  items_total: number;
  order_id: number;
  shipping_method: string;
  shipping_quotes: string;
  shipping_zone_id: number;
  shipping_zone_name: string;
}

export interface OrderShippingsItem extends OrderShippingAddressItem {
  shipmentItems: OrderShippedItem[];
  notShip: {
    itemsInfo: OrderProductItem[];
  };
}

export interface OrderHistoryItem {
  createdAt: number;
  eventType: number;
  id: number;
  status: string;
}

export interface MoneyFormat {
  currency_location: 'left' | 'right';
  currency_token: string;
  decimal_token: string;
  decimal_places: number;
  thousands_token: string;
  currency_exchange_rate: string;
}

export interface OrderPayment {
  updatedAt?: string;
  billingAddress?: Address;
  paymentMethod?: string;
  dateCreateAt?: string | number;
}

export interface OrderBillings {
  billingAddress: Address;
  digitalProducts: OrderProductItem[];
}

interface CouponsInfo {
  amount: string;
  code: string;
  coupon_id: number;
  discount: string;
  id: number;
  order_id: number;
  type: number;
}

export interface B2BOrderData {
  baseHandlingCost: string;
  baseShippingCost: string;
  baseWrappingCost: string;
  billingAddress: Address;
  canReturn: boolean;
  cartId: string;
  channelId: string;
  companyName: string | null;
  couponDiscount: string;
  coupons: CouponsInfo[];
  createdEmail: string;
  creditCardType: string | null;
  currencyCode: string;
  currencyExchangeRate: string;
  currencyId: number;
  customStatus: string;
  customerId: number;
  customerLocale: string;
  customerMessage: string;
  dateCreated: string;
  dateModified: string;
  dateShipped: string;
  defaultCurrencyCode: string;
  defaultCurrencyId: number;
  digitalProducts: OrderProductItem[];
  discountAmount: string;
  ebayOrderId: string;
  firstName: string;
  handlingCostExTax: string;
  handlingCostIncTax: string;
  handlingCostTax: string;
  handlingCostTaxClassId: number;
  id: string;
  invoiceId: string | null;
  ipStatus: number;
  isDeleted: boolean;
  isEmailOptIn: boolean;
  isInvoiceOrder: boolean;
  itemsShipped: number;
  itemsTotal: number;
  lastName: string;
  money: MoneyFormat;
  orderHistoryEvent: OrderHistoryItem[];
  orderIsDigital: boolean;
  paymentMethod: string;
  paymentProviderId: string | null;
  paymentStatus: string;
  poNumber: string;
  products: OrderProductItem[];
  referenceNumber: string;
  refundedAmount: string;
  shipments: OrderShipmentItem[];
  shippingAddress: OrderShippingAddressItem[] | false;
  shippingAddressCount: number;
  shippingCostExTax: string;
  shippingCostIncTax: string;
  shippingCostTax: string;
  shippingCostTaxClassId: string;
  status: string;
  statusId: number;
  storeCreditAmount: string;
  storeDefaultCurrencyCode: string;
  storeDefaultToTransactionalExchangeRate: string;
  subtotalExTax: string;
  subtotalIncTax: string;
  subtotalTax: string;
  taxProviderId: string;
  totalExTax: string;
  totalIncTax: string;
  totalTax: string;
  updatedAt: string;
  wrappingCostExTax: string;
  wrappingCostIncTax: string;
  wrappingCostTax: string;
  wrappingCostTaxClassId: number;
  companyInfo: CompanyInfoTypes;
}

export interface OrderSummary {
  createAt: string;
  name: string;
  priceData: {
    [k: string]: string;
  };
  priceSymbol: {
    [k: string]: string;
  };
}
