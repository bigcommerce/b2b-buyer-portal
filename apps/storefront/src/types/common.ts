export interface Modifiers {
  config?: {
    default_value?: string;
    text_characters_limited?: boolean;
    text_max_length?: number;
    text_min_length?: number;
    text_lines_limited?: boolean;
    text_max_lines?: number;
    date_earliest_value?: string;
    date_latest_value?: string;
    date_limit_mode?: string;
    date_limited?: boolean;
    number_highest_value?: number;
    number_integers_only?: boolean;
    number_limit_mode?: string;
    number_limited?: boolean;
    number_lowest_value?: number;
    checkbox_label?: string;
    checked_by_default?: boolean;
    file_max_size?: number;
    file_types_mode?: string;
    file_types_other?: string[];
    file_types_supported?: string[];
  };
  display_name: string;
  id?: number | string;
  option_values: ModifiersOption[];
  required: boolean;
  type: string;
  isVariantOption?: boolean;
}

interface ModifiersOption {
  id: number;
  is_default: boolean;
  label: string;
  option_id: number;
  value_data?: {
    colors?: string[];
    product_id?: number;
  };
}

export interface ProductItemOption {
  display_name: string;
  is_required: boolean;
  option_id: number;
  sort_order: number;
}
