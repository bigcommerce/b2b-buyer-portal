import { Modifiers, ProductItemOption } from './common';
import { AllOptionProps, ProductItem, Variant } from './products';

export interface ShoppingListItem {
  customerInfo: {
    firstName: string;
    lastName: string;
    userId: string;
    email: string;
  };
  description: string;
  grandTotal: string;
  id: string;
  isOwner: boolean;
  isShowGrandTotal: boolean;
  name: string;
  status: number;
  totalDiscount: string;
  totalTax: string;
}

export enum ShoppingListStatus {
  Approved = 0,
  Deleted = 20,
  Draft = 30,
  ReadyForApproval = 40,
  Rejected = 50,
}

export interface ShoppingListProductItem extends ProductItem {
  options?: ProductItemOption[];
  optionsV3?: Modifiers[];
  modifiers?: Modifiers[];
  costPrice?: string;
  variants?: Variant[];
  allOptions?: Array<Partial<AllOptionProps>>;
  selectOptions?: string;
  orderQuantityMaximum?: number;
  orderQuantityMinimum?: number;
  variantId?: number | string;
}

export interface ShoppingListAddProductOption {
  optionId: string;
  optionValue: string;
}

export interface ShoppingListSelectProductOption {
  option_id: string;
  option_value: string;
  optionId: string;
  optionValue: string;
}
