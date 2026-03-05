import { createB2BShoppingList, createBcShoppingList } from '@/shared/service/b2b';
import { store } from '@/store';
import { ShoppingListStatus } from '@/types/shoppingList';

import { validatePermissionWithComparisonType } from '../b3CheckPermissions/check';
import { b2bPermissionsMap } from '../b3CheckPermissions/config';
import { getBCPrice } from '../b3Product/b3Product';
import { ListItemProps, ProductsProps } from '../b3Product/shared/config';
import { channelId } from '../basicConfig';

interface CreateShoppingListParams {
  data: { name: string; description: string };
  isB2BUser: boolean;
}

const createShoppingList = ({
  data,
  isB2BUser,
}: // currentChannelId,
CreateShoppingListParams) => {
  const createShoppingData: Record<string, string | number> = data;

  const createSL = isB2BUser ? createB2BShoppingList : createBcShoppingList;

  if (isB2BUser) {
    const submitShoppingListPermission = validatePermissionWithComparisonType({
      containOrEqual: 'contain',
      code: b2bPermissionsMap.submitShoppingListPermission,
    });
    const selectCompanyHierarchyId =
      store.getState()?.company?.companyHierarchyInfo?.selectCompanyHierarchyId || 0;
    createShoppingData.status = submitShoppingListPermission
      ? ShoppingListStatus.Draft
      : ShoppingListStatus.Approved;
    if (selectCompanyHierarchyId) {
      createShoppingData.companyId = selectCompanyHierarchyId;
    }
  } else {
    createShoppingData.channelId = channelId;
  }

  return createSL({ ...createShoppingData, channelId });
};

export default createShoppingList;

interface FailedProductInput {
  product: ProductsProps;
  availableToSell?: number;
}

export const mapToProductsFailedArray = (inputs: FailedProductInput[]) => {
  return inputs.map(({ product, availableToSell }) => {
    return {
      ...product,
      isStock: product.node.productsSearch.inventoryTracking === 'none' ? '0' : '1',
      minQuantity: product.node.productsSearch.orderQuantityMinimum,
      maxQuantity: product.node.productsSearch.orderQuantityMaximum,
      stock: product.node.productsSearch.unlimitedBackorder
        ? Infinity
        : (availableToSell ?? product.node.productsSearch.availableToSell),
    };
  });
};

export const calculateSubTotal = (checkedArr: CustomFieldItems) => {
  if (checkedArr.length > 0) {
    let total = 0.0;

    checkedArr.forEach((item: ListItemProps) => {
      const {
        node: { quantity, basePrice, taxPrice },
      } = item;

      const price = getBCPrice(Number(basePrice), Number(taxPrice));

      total += price * Number(quantity);
    });

    return (1000 * total) / 1000;
  }

  return 0.0;
};

export const verifyInventory = (checkedArr: ProductsProps[], inventoryInfos: ProductsProps[]) => {
  const validateFailureArr: ProductsProps[] = [];
  const validateSuccessArr: ProductsProps[] = [];

  checkedArr.forEach((item: ProductsProps) => {
    const { node } = item;

    const inventoryInfo: CustomFieldItems =
      inventoryInfos.find((option: CustomFieldItems) => option.variantSku === node.variantSku) ||
      {};

    if (inventoryInfo) {
      let isPassVerify = true;
      if (
        inventoryInfo.isStock === '1' &&
        (node?.quantity ? Number(node.quantity) : 0) > inventoryInfo.stock
      )
        isPassVerify = false;

      if (
        inventoryInfo.minQuantity !== 0 &&
        (node?.quantity ? Number(node.quantity) : 0) < inventoryInfo.minQuantity
      )
        isPassVerify = false;

      if (
        inventoryInfo.maxQuantity !== 0 &&
        (node?.quantity ? Number(node.quantity) : 0) > inventoryInfo.maxQuantity
      )
        isPassVerify = false;

      if (isPassVerify) {
        validateSuccessArr.push({
          node,
        });
      } else {
        validateFailureArr.push({
          node: {
            ...node,
          },
          stock: inventoryInfo.stock,
          isStock: inventoryInfo.isStock,
          maxQuantity: inventoryInfo.maxQuantity,
          minQuantity: inventoryInfo.minQuantity,
        });
      }
    }
  });

  return {
    validateFailureArr,
    validateSuccessArr,
  };
};
