import { LangFormatFunction } from '@/lib/lang';
import {
  ValidatedProductError,
  ValidatedProductSuccess,
  ValidatedProductWarning,
} from '@/utils/validateProducts';

import { EditableProductItem, OrderProductOption } from '../../../types';

interface ProductOptionSelection {
  optionId: number;
  optionValue: string | number;
}

export interface ProductToAdd {
  productId: number;
  variantId: number;
  quantity: number;
  optionSelections: ProductOptionSelection[];
  allOptions?: OrderProductOption[];
}

export interface ProductOptionForValidation {
  optionId: number;
  optionValue: string;
}

interface ProductSearchForValidation {
  variantId: number;
  newSelectOptionList: ProductOptionForValidation[];
}

interface ProductNodeForValidation {
  productId: number;
  quantity: number;
  productName: string;
  productsSearch: ProductSearchForValidation;
}

export interface ProductForValidation {
  node: ProductNodeForValidation;
}

export interface VariantInfo {
  variantSku: string;
  minQuantity: number;
  maxQuantity: number;
  stock: number;
  isStock: string;
}

export interface ProcessValidationErrorParams {
  err: ValidatedProductError;
  editableProducts: EditableProductItem[];
  b3Lang: LangFormatFunction;
}

export interface ProcessValidationWarningParams {
  warn: ValidatedProductWarning;
  editableProducts: EditableProductItem[];
}

export interface ProcessValidationSuccessParams {
  validatedProduct: ValidatedProductSuccess;
  editableProducts: EditableProductItem[];
}

export interface ProcessValidationResultsParams {
  success: ValidatedProductSuccess[];
  warning: ValidatedProductWarning[];
  error: ValidatedProductError[];
  editableProducts: EditableProductItem[];
  setEditableProducts: (products: EditableProductItem[]) => void;
  b3Lang: LangFormatFunction;
}

export interface TransformProductsForValidationParams {
  productsToAdd: ProductToAdd[];
  editableProducts: EditableProductItem[];
}
