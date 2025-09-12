import { useCallback } from 'react';

import { deleteCart, getCart } from '@/shared/service/bc/graphql/cart';
import { ProductsProps } from '@/utils/b3Product/shared/config';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { callCart, deleteCartData, updateCart } from '@/utils/cartUtils';

export enum CartValidationStrategyTypes {
  SHOPPING_LIST_FOOTER = 'shopping-list-footer',
  SHOPPING_LIST_RE_ADD = 'shopping-list-re-add',
  QUICK_ORDER = 'quick-order',
  QUICK_ADD = 'quick-add',
  BULK_ORDER = 'bulk-order',
  QUOTE = 'quote',
}

type ValidationContext = {
  type: CartValidationStrategyTypes;
  backOrderingEnabled: boolean;
  fallback: () => void;
  b3Lang?: (key: string, options?: any) => string;
  setLoading?: (loading: boolean) => void;
  [key: string]: any;
};

type ValidationResult = {
  failureProducts?: ProductsProps[];
  successProducts?: ProductsProps[];
  isValid?: boolean;
  errors: string | null;
  isFallback?: boolean;
};

interface ICartValidationStrategy {
  validate(products: ProductsProps[], context: ValidationContext): Promise<ValidationResult>;
}

const cartInventoryValidationStrategies: Record<string, ICartValidationStrategy> = {
  [CartValidationStrategyTypes.SHOPPING_LIST_FOOTER]: {
    async validate(products, context) {
      const items = products.map(({ node }: ProductsProps) => {
        return { node };
      });
      try {
        const skus: string[] = [];

        products.forEach((item: ProductsProps) => {
          const { node } = item;
          skus.push(node.variantSku);
        });

        if (skus.length === 0) {
          let errorMessage = '';

          if (context.allowJuniorPlaceOrder) {
            errorMessage =
              typeof context.b3Lang === 'function'
                ? context.b3Lang('shoppingList.footer.selectItemsToCheckout')
                : '';
          } else {
            errorMessage =
              typeof context.b3Lang === 'function'
                ? context.b3Lang('shoppingList.footer.selectItemsToAddToCart')
                : '';
          }

          return {
            errors: errorMessage,
          };
        }
        const lineItems = context.addLineItems(items);
        const deleteCartObject = deleteCartData(items);
        const cartInfo = await getCart();
        // @ts-expect-error Keeping it like this to avoid breaking changes, will fix in a following commit.
        if (context.allowJuniorPlaceOrder && cartInfo.length) {
          await deleteCart(deleteCartObject);
          await updateCart(cartInfo, lineItems);
        } else {
          await callCart(lineItems);
          b3TriggerCartNumber();
        }
      } catch (e: unknown) {
        if (e instanceof Error) {
          context?.setValidateFailureProducts(items as ProductsProps[]);
          return {
            errors: e.message,
            failureProducts: items,
          };
        }
        return {
          errors: 'An unexpected error occurred',
          failureProducts: products,
        };
      }
      context?.setValidateSuccessProducts(items as ProductsProps[]);
      return {
        errors: null,
        successProducts: items,
      };
    },
  },
  [CartValidationStrategyTypes.SHOPPING_LIST_RE_ADD]: {
    async validate(products, context) {
      try {
        const lineItems = context.addLineItems(products);
        const res = await callCart(lineItems);

        if (!res.errors) {
          b3TriggerCartNumber();
        }

        if (res.errors) {
          return {
            errors: res.message,
            failureProducts: products,
          };
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          return {
            errors: error.message,
            failureProducts: products,
          };
        }
      }

      return {
        errors: 'An unexpected error occurred',
        failureProducts: products,
      };
    },
  },
  [CartValidationStrategyTypes.QUICK_ORDER]: {
    async validate(products, context) {
      // TODO: Implement QuickOrderInventoryValidation logic
      return { errors: `${context.type} Not implemented`, failureProducts: products };
    },
  },
  [CartValidationStrategyTypes.QUICK_ADD]: {
    async validate(products, context) {
      // TODO: Implement QuickAddInventoryValidation logic
      return { errors: `${context.type} Not implemented`, failureProducts: products };
    },
  },
  [CartValidationStrategyTypes.BULK_ORDER]: {
    async validate(products, context) {
      // TODO: Implement BulkOrderInventoryValidation logic
      return { errors: `${context.type} Not implemented`, failureProducts: products };
    },
  },
  [CartValidationStrategyTypes.QUOTE]: {
    async validate(products, context) {
      // TODO: Implement QuoteInventoryValidation logic
      return { errors: `${context.type} Not implemented`, failureProducts: products };
    },
  },
};

const fallbackInventoryValidation: ICartValidationStrategy = {
  async validate(_products, context) {
    await context.fallback();
    return {
      errors: null,
      isFallback: true,
    };
  },
};

const resolveInventoryValidationStrategy = (
  type: string,
  backOrderingEnabled: boolean,
): ICartValidationStrategy => {
  if (!backOrderingEnabled) {
    return fallbackInventoryValidation;
  }
  return cartInventoryValidationStrategies[type] || fallbackInventoryValidation;
};

export const useCartInventoryValidation = () => {
  return useCallback(
    async (products: ProductsProps[], context: ValidationContext): Promise<ValidationResult> => {
      const strategy = resolveInventoryValidationStrategy(
        context.type,
        context.backOrderingEnabled,
      );
      return strategy.validate(products, context);
    },
    [],
  );
};
