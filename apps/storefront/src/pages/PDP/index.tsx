import { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import config from '@/lib/config';
import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { serialize } from '@/utils/b3Serialize';

import CreateShoppingList from '../OrderDetail/components/CreateShoppingList';
import OrderShoppingList from '../OrderDetail/components/OrderShoppingList';

import { addProductsToShoppingList } from './addProductsToShoppingList';
import { addProductsToShoppingListErrorHandler } from './addProductsToShoppingListErrorHandler';
import { useAddedToShoppingListAlert } from './useAddedToShoppingListAlert';

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
      return window.b2b.utils.shoppingList.itemFromCurrentPage[0];
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

  const handleShoppingClose = () => {
    window.scrollTo(0, 0);
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
      await addToShoppingList({ shoppingListId, product })
        .then(() => displayAddedToShoppingListAlert(shoppingListId))
        .catch(addProductsToShoppingListErrorHandler);

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
