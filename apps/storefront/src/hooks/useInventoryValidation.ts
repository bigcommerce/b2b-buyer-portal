import { deleteCart, getCart } from '@/shared/service/bc/graphql/cart';
import { ProductsProps } from '@/utils/b3Product/shared/config';
import b3TriggerCartNumber from '@/utils/b3TriggerCartNumber';
import { callCart, deleteCartData, updateCart } from '@/utils/cartUtils';
import { useCallback } from 'react';

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

class ShoppingListFooterInventoryValidation implements ICartValidationStrategy {
  async validate(products: ProductsProps[], context: ValidationContext): Promise<ValidationResult> {
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
        return {
          errors: context['allowJuniorPlaceOrder']
            ? typeof context.b3Lang === 'function'
              ? context.b3Lang('shoppingList.footer.selectItemsToCheckout')
              : ''
            : typeof context.b3Lang === 'function'
              ? context.b3Lang('shoppingList.footer.selectItemsToAddToCart')
              : '',
        };
      }
      const lineItems = context.addLineItems(items);
      const deleteCartObject = deleteCartData(items);
      const cartInfo = await getCart();
      // @ts-expect-error Keeping it like this to avoid breaking changes, will fix in a following commit.
      if (context['allowJuniorPlaceOrder'] && cartInfo.length) {
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
    }
    context?.setValidateSuccessProducts(items as ProductsProps[]);
    return {
      errors: null,
      successProducts: items,
    };
  }
}

class ShoppingListReAddInventoryValidation implements ICartValidationStrategy {
  async validate(products: ProductsProps[], context: ValidationContext): Promise<ValidationResult> {
    throw new Error(`Method ${context.type} not implemented. ${products}`);
  }
}

class QuickOrderInventoryValidation implements ICartValidationStrategy {
  async validate(products: ProductsProps[], context: ValidationContext): Promise<ValidationResult> {
    throw new Error(`Method ${context.type} not implemented. ${products}`);
  }
}
class QuickAddInventoryValidation implements ICartValidationStrategy {
  async validate(products: ProductsProps[], context: ValidationContext): Promise<ValidationResult> {
    throw new Error(`Method ${context.type} not implemented. ${products}`);
  }
}
class BulkOrderInventoryValidation implements ICartValidationStrategy {
  async validate(products: ProductsProps[], context: ValidationContext): Promise<ValidationResult> {
    throw new Error(`Method ${context.type} not implemented. ${products}`);
  }
}
class QuoteInventoryValidation implements ICartValidationStrategy {
  async validate(products: ProductsProps[], context: ValidationContext): Promise<ValidationResult> {
    throw new Error(`Method ${context.type} not implemented. ${products}`);
  }
}

// an anonymous class that implements ICartValidationStrategy to be called as fallback on line 103
class FallbackInventoryValidation implements ICartValidationStrategy {
  async validate(
    _products: ProductsProps[],
    context: ValidationContext,
  ): Promise<ValidationResult> {
    await context.fallback();
    return {
      errors: null,
      isFallback: true,
    };
  }
}

class InventoryValidationStrategyFactory {
  private static strategies: Map<string, new () => ICartValidationStrategy> = new Map();

  static {
    this.strategies.set(
      CartValidationStrategyTypes.SHOPPING_LIST_FOOTER,
      ShoppingListFooterInventoryValidation,
    );
    this.strategies.set(
      CartValidationStrategyTypes.SHOPPING_LIST_RE_ADD,
      ShoppingListReAddInventoryValidation,
    );
    this.strategies.set(CartValidationStrategyTypes.QUICK_ORDER, QuickOrderInventoryValidation);
    this.strategies.set(CartValidationStrategyTypes.QUICK_ADD, QuickAddInventoryValidation);
    this.strategies.set(CartValidationStrategyTypes.BULK_ORDER, BulkOrderInventoryValidation);
    this.strategies.set(CartValidationStrategyTypes.QUOTE, QuoteInventoryValidation);
  }

  static createStrategy(type: string, backOrderingEnabled: boolean): ICartValidationStrategy {
    const StrategyClass = this.strategies.get(type);
    return backOrderingEnabled && StrategyClass
      ? new StrategyClass()
      : new FallbackInventoryValidation();
  }

  static registerStrategy(type: string, strategyClass: new () => ICartValidationStrategy): void {
    this.strategies.set(type, strategyClass);
  }
}

export const useCartInventoryValidation = () => {
  return useCallback(
    async (products: ProductsProps[], context: ValidationContext): Promise<ValidationResult> => {
      const strategy = InventoryValidationStrategyFactory.createStrategy(
        context.type,
        context.backOrderingEnabled,
      );
      return strategy.validate(products, context);
    },
    [],
  );
};
