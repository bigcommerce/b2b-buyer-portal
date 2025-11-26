/**
 * Represents the configuration for a modifier.
 * Includes fields for both Text and Checkbox types found in the data.
 */
interface ModifierConfig {
  default_value?: string;
  text_characters_limited?: boolean;
  text_min_length?: number;
  text_max_length?: number;
  checkbox_label?: string;
  checked_by_default?: boolean;
}

interface PurchasingDisabledInfo {
  status: boolean;
  message: string;
}

interface Adjusters {
  price: number | null;
  weight: number | null;
  image_url: string;
  purchasing_disabled: PurchasingDisabledInfo;
}

interface ModifierOptionValue {
  id: number;
  option_id: number;
  label: string;
  sort_order: number;
  value_data: {
    checked_value?: boolean;
  };
  is_default: boolean;
  adjusters: Adjusters;
}

interface ProductModifier {
  id: number;
  product_id: number;
  name: string;
  display_name: string;
  type: 'text' | 'checkbox' | string;
  required: boolean;
  sort_order: number;
  config: ModifierConfig;
  option_values: ModifierOptionValue[];
}

interface ProductOption {
  id: number;
  label: string;
  option_id: number;
  option_display_name: string;
}

interface ProductDetails {
  variantSku: string;
  productId: string;
  calculatedPrice: number;
  imageUrl: string;
  variantId: number;
  baseSku: string;
  productName: string;
  categories: unknown[];
  option: ProductOption[];
  minQuantity: number;
  maxQuantity: number;
  purchasingDisabled: boolean;
  isVisible: '0' | '1';
  isStock: '0' | '1';
  stock: number;
  modifiers: ProductModifier[];
}

/**
 * The main container type for a single entry in the 'validProduct' array
 */
export interface ValidProductItem {
  products: ProductDetails;
  sku: string;
  qty: string;
  row: number;
}
