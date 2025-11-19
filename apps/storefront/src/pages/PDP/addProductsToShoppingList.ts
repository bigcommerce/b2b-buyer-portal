import {
  addProductToBcShoppingList,
  addProductToShoppingList,
  searchProducts,
} from '@/shared/service/b2b';
import { store } from '@/store';
import { getProductOptionList, isAllRequiredOptionFilled } from '@/utils/b3AddToShoppingList';
import { getValidOptionsList } from '@/utils/b3Product/b3Product';
import { getActiveCurrencyInfo } from '@/utils/currencyUtils';
import { ValidationError } from '@/utils/validationError';

import { conversionProductsList } from '../../utils/b3Product/shared/config';

interface AddProductsToShoppingListParams {
  isB2BUser: boolean;
  items: CustomFieldItems[];
  shoppingListId: number | string;
  customerGroupId?: number;
}

export const addProductsToShoppingList = async ({
  isB2BUser,
  customerGroupId,
  items,
  shoppingListId,
}: AddProductsToShoppingListParams) => {
  const { currency_code: currencyCode } = getActiveCurrencyInfo();
  const { id: companyId } = store.getState().company.companyInfo;

  const { productsSearch } = await searchProducts({
    productIds: items.map(({ productId }) => productId),
    currencyCode,
    companyId,
    customerGroupId,
  });

  const productsInfo = conversionProductsList(productsSearch);
  const products = [];

  for (let index = 0; index < productsInfo.length; index += 1) {
    const { allOptions: requiredOptions, variants } = productsInfo[index];
    const { productId, sku, variantId: vId, quantity, optionSelections } = items[index];
    // check if it's an specified product
    const variantId =
      vId ||
      variants.find((item: { sku: string }) => item.sku === sku)?.variant_id ||
      variants[0]?.variant_id;
    // get selected options by inputted data
    const optionList = !optionSelections ? [] : getProductOptionList(optionSelections);
    // verify inputted data includes required data
    const { isValid, message } = isAllRequiredOptionFilled(requiredOptions, optionList);

    if (!isValid) {
      throw new ValidationError(message);
    }

    const newOptionLists = getValidOptionsList(optionList, productsInfo[index]);
    products.push({
      productId,
      variantId,
      quantity,
      optionList: newOptionLists,
    });
  }

  const addToShoppingList = isB2BUser ? addProductToShoppingList : addProductToBcShoppingList;

  await addToShoppingList({
    shoppingListId,
    items: products,
  });
};
