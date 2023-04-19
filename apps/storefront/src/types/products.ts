export interface ProductOptionsItem {
  option_id: number,
  display_name: string,
  display_value: string,
}

export interface BcCalculatedPrice {
  as_entered: number,
  entered_inclusive: boolean,
  tax_exclusive: number,
  tax_inclusive: number,
}

export interface VariantsProps {
  bc_calculated_price: BcCalculatedPrice,
  sku: string,
  product_id: number | string,
  variant_id: number | string,
}

export interface ProductItem {
  id: number,
  sku: string,
  quantity: number,
  imageUrl: string,
  name: string,
  base_price: string,
  product_options?: ProductOptionsItem[],
  helperText?: string,
  productUrl?: string,
  variants?: VariantsProps[],
  price_inc_tax?: string | number,
  price_ex_tax?: string | number,
}

export interface ProductVariantSkuInfo{
  baseSku: string,
  calculatedPrice: string,
  categories: string[],
  isStock: string,
  isVisible: string,
  maxQuantity: number,
  minQuantity: number,
  modifiers: string[],
  option: string[],
  productId: string,
  productName: string,
  purchasingDisabled: string,
  stock: number,
  variantId: string,
  variantSku: string,
}

interface OptionValue {
  id: number;
  label: string;
  option_id: number;
  option_display_name: string;
}

interface Variant {
  variant_id: number;
  product_id: number;
  sku: string;
  option_values: OptionValue[];
  calculated_price: number;
  image_url: string;
  has_price_list: boolean;
  bulk_prices: any[]; // not sure about the type
  purchasing_disabled: boolean;
  cost_price: number;
  inventory_level: number;
  bc_calculated_price: {
    as_entered: number;
    tax_inclusive: number;
    tax_exclusive: number;
    entered_inclusive: boolean;
  };
}

interface Modifier {
  id: number;
  display_name: string;
  type: string;
  required: boolean;
  config: any; // not sure about the type
  option_values: any[]; // not sure about the type
}

interface Option {
  option_id: number;
  display_name: string;
  sort_order: number;
  is_required: boolean;
}

interface OptionV3 {
  id: number;
  product_id: number;
  name: string;
  display_name: string;
  type: string;
  sort_order: number;
  option_values: OptionValue[];
}

interface ALlOptionValue {
  id: number;
  label: string;
  sort_order: number;
  value_data: {
    colors?: string[];
    product_id?: number;
    checked_value?: boolean;
  } | null;
  is_default: boolean;
  adjusters?: {
    price: {
      adjuster: string;
      adjuster_value: number;
    } | null;
    weight: {
      adjuster: string;
      adjuster_value: number;
    } | null;
    image_url: string;
    purchasing_disabled: {
      status: boolean;
      message: string;
    };
  } | null;
}

export interface AllOptionProps {
  id: number;
  product_id?: number;
  name: string;
  display_name: string;
  type: string;
  sort_order: number;
  option_values: ALlOptionValue[];
  config: {
    product_list_adjusts_inventory?: boolean;
    product_list_adjusts_pricing?: boolean;
    product_list_shipping_calc?: string;
    default_value?: string;
    text_characters_limited?: boolean;
    text_min_length?: number;
    text_max_length?: number;
    checkbox_label?: string;
    checked_by_default?: boolean;
  } | null;
  required: boolean;
  isVariantOption?: boolean;
}

export interface Product {
  id: number;
  name: string;
  sku: string;
  costPrice: string;
  channelId: number[],
  inventoryLevel: number;
  inventoryTracking: string;
  availability: string;
  orderQuantityMinimum: number;
  orderQuantityMaximum: number;
  variants: Variant[];
  currencyCode: string;
  imageUrl: string;
  modifiers: Modifier[];
  options: Option[];
  optionsV3: OptionV3[];
  allOptions: AllOptionProps
  productUrl: string;
  quantity: number;
  [key:string]: any;
}
