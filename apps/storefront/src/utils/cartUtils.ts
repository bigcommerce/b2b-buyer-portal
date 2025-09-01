import Cookies from 'js-cookie';

import { dispatchEvent } from '@/hooks';
import { addNewLineToCart, createNewCart, getCart } from '@/shared/service/bc/graphql/cart';

import { LineItem } from './b3Product/b3Product';

const handleSplitOptionId = (id: string | number) => {
  if (typeof id === 'string' && id.includes('attribute')) {
    const idRight = id.split('[')[1];

    const optionId = idRight.split(']')[0];
    return Number(optionId);
  }

  if (typeof id === 'number') {
    return id;
  }

  return undefined;
};

const cartLineItems = (products: any) => {
  const items = products.map((product: any) => {
    const { newSelectOptionList, quantity, optionSelections, allOptions = [] } = product;
    let options = [];
    options = newSelectOptionList || optionSelections;
    const selectedOptions = options.reduce(
      (a: any, c: any) => {
        const optionValue = parseInt(c.optionValue, 10);
        const splitOptionId = handleSplitOptionId(c.optionId);
        const productOption = allOptions.find((option: CustomFieldItems) => {
          const id = option?.product_option_id || option?.id || '';
          return id === splitOptionId;
        });
        if (
          Number.isNaN(optionValue) ||
          productOption?.type === 'text' ||
          productOption?.type === 'Text field'
        ) {
          a.textFields.push({
            optionEntityId: splitOptionId,
            text: c.optionValue,
          });
        } else if (typeof optionValue === 'number') {
          a.multipleChoices.push({
            optionEntityId: splitOptionId,
            optionValueEntityId: parseInt(c.optionValue, 10),
          });
        }

        return a;
      },
      {
        multipleChoices: [],
        textFields: [],
      },
    );

    return {
      quantity: parseInt(quantity || product.qty, 10),
      productEntityId: parseInt(product.productId || product.id, 10),
      variantEntityId: parseInt(product.variantId || product.products.variantId, 10),
      selectedOptions,
    };
  });

  return items;
};

const newDataCart = (productData: any) => ({
  createCartInput: {
    lineItems: cartLineItems(productData),
  },
});

export const deleteCartData = (entityId: any) => ({
  deleteCartInput: {
    cartEntityId: entityId,
  },
});

const getLineItemsData = (cartInfo: any, productData: any) => {
  const lineItems = cartLineItems(productData);

  return {
    addCartLineItemsInput: {
      cartEntityId: cartInfo.data.site.cart.entityId,
      data: {
        lineItems,
      },
    },
  };
};

const createNewShoppingCart = async (products: any) => {
  const cartData = newDataCart(products);
  const res = await createNewCart(cartData);
  if (res?.errors?.length) {
    throw new Error(res.errors[0].message);
  }
  const { entityId } = res.data.cart.createCart.cart;
  Cookies.set('cartId', entityId);
  dispatchEvent('on-cart-created', {
    cartId: entityId,
  });
  return res;
};

export const updateCart = async (cartInfo: any, productData: any) => {
  const newItems = getLineItemsData(cartInfo, productData);
  const res = await addNewLineToCart(newItems);

  if (res?.errors?.length) {
    throw new Error(res.errors[0].message);
  }

  return res;
};

export const callCart = async (lineItems: LineItem[] | CustomFieldItems[]) => {
  const cartInfo = await getCart();

  const res = cartInfo?.data?.site?.cart
    ? await updateCart(cartInfo, lineItems)
    : await createNewShoppingCart(lineItems);

  return res;
};
