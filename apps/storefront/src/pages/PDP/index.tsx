import { lazy, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import config from '@b3/global-b3';
import { useB3Lang } from '@b3/lang';

import { GlobalContext } from '@/shared/global';
import {
  addProductToBcShoppingList,
  addProductToShoppingList,
  searchB2BProducts,
  searchBcProducts,
} from '@/shared/service/b2b';
import { isB2BUserSelector, store, useAppSelector } from '@/store';
import { getActiveCurrencyInfo, globalSnackbar, serialize } from '@/utils';
import { getProductOptionList, isAllRequiredOptionFilled } from '@/utils/b3AddToShoppingList';
import { getValidOptionsList } from '@/utils/b3Product/b3Product';

import { conversionProductsList } from '../../utils/b3Product/shared/config';

import { useAddedToShoppingListAlert } from './useAddedToShoppingListAlert';

export { useAddedToShoppingListAlert } from './useAddedToShoppingListAlert';

const CreateShoppingList = lazy(() => import('../OrderDetail/components/CreateShoppingList'));
const OrderShoppingList = lazy(() => import('../OrderDetail/components/OrderShoppingList'));

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
  const getProducts = isB2BUser ? searchB2BProducts : searchBcProducts;

  const { productsSearch } = await getProducts({
    productIds: items.map(({ productId }) => productId),
    currencyCode,
    companyId,
    customerGroupId,
  });

  const productsInfo = conversionProductsList(productsSearch);
  const products = [];
  let isError = false;

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
      isError = true;
      globalSnackbar.error(message, {
        isClose: true,
      });
      break;
    }

    const newOptionLists = getValidOptionsList(optionList, productsInfo[index]);
    products.push({
      productId,
      variantId,
      quantity,
      optionList: newOptionLists,
    });
  }

  if (isError) return;

  const addToShoppingList = isB2BUser ? addProductToShoppingList : addProductToBcShoppingList;

  await addToShoppingList({
    shoppingListId,
    items: products,
  });
};

function useData() {
  const {
    state: { shoppingListClickNode },
  } = useContext(GlobalContext);
  const customerGroupId = useAppSelector(({ company }) => company.customer.customerGroupId);
  const platform = useAppSelector(({ global }) => global.storeInfo.platform);
  const setOpenPageFn = useAppSelector(({ global }) => global.setOpenPageFn);
  const isB2BUser = useAppSelector(isB2BUserSelector);

  const getShoppingListItem = () => {
    if (platform !== 'bigcommerce') {
      const {
        itemFromCurrentPage: [product],
      } = window.b2b.utils.shoppingList;
      return product;
    }

    if (!shoppingListClickNode) return undefined;

    const productView: HTMLElement | null = shoppingListClickNode.closest(
      config['dom.productView'],
    );
    if (!productView) return undefined;

    const productId = (productView.querySelector('input[name=product_id]') as any)?.value;
    const quantity = (productView.querySelector('[name="qty[]"]') as any)?.value ?? 1;
    const sku = (productView.querySelector('[data-product-sku]')?.innerHTML ?? '').trim();
    const form = productView.querySelector('form[data-cart-item-add]') as HTMLFormElement;
    return {
      productId: Number(productId),
      sku,
      quantity: Number(quantity),
      optionSelections: serialize(form),
    };
  };

  const addToShoppingList = ({
    shoppingListId,
    product,
  }: {
    shoppingListId: string | number;
    product: CustomFieldItems;
  }) =>
    addProductsToShoppingList({
      isB2BUser,
      customerGroupId,
      shoppingListId,
      items: [product],
    });

  return { setOpenPageFn, getShoppingListItem, addToShoppingList };
}

function PDP() {
  const { setOpenPageFn, getShoppingListItem, addToShoppingList } = useData();
  const b3Lang = useB3Lang();

  const [openShoppingList, setOpenShoppingList] = useState<boolean>(true);
  const [isOpenCreateShopping, setIsOpenCreateShopping] = useState<boolean>(false);

  const [isRequestLoading, setIsRequestLoading] = useState<boolean>(false);
  const displayAddedToShoppingListAlert = useAddedToShoppingListAlert();

  const navigate = useNavigate();

  useEffect(() => () => {
    window.scrollTo(0, 0);
  }, []);

  const handleShoppingClose = () => {
    setOpenShoppingList(false);
    setIsOpenCreateShopping(false);
    navigate('/');
    setOpenPageFn?.({
      isOpen: false,
      openUrl: '',
    });
  };

  const handleShoppingConfirm = async (shoppingListId: string) => {
    const product = getShoppingListItem();

    if (!product) return;
    try {
      setIsRequestLoading(true);
      await addToShoppingList({ shoppingListId, product }).then(() =>
        displayAddedToShoppingListAlert(shoppingListId),
      );

      handleShoppingClose();
    } finally {
      setIsRequestLoading(false);
    }
  };
  const handleOpenCreateDialog = () => {
    setOpenShoppingList(false);
    setIsOpenCreateShopping(true);
  };

  const handleCloseShoppingClick = () => {
    setIsOpenCreateShopping(false);
    setOpenShoppingList(true);
  };

  const handleCreateShoppingClick = () => {
    handleCloseShoppingClick();
    setOpenShoppingList(true);
  };

  return (
    <>
      <OrderShoppingList
        isOpen={openShoppingList}
        dialogTitle={b3Lang('pdp.addToShoppingList')}
        onClose={handleShoppingClose}
        onConfirm={handleShoppingConfirm}
        onCreate={handleOpenCreateDialog}
        isLoading={isRequestLoading}
        setLoading={setIsRequestLoading}
      />
      <CreateShoppingList
        open={isOpenCreateShopping}
        onChange={handleCreateShoppingClick}
        onClose={handleCloseShoppingClick}
      />
    </>
  );
}

export default PDP;
