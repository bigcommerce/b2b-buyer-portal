import Cookies from 'js-cookie';

import { CreateCartInput, DeleteCartInput } from '@/types/cart';
import { LineItem } from '@/utils/b3Product/b3Product';
import { platform } from '@/utils/basicConfig';

import B3Request from '../../request/b3Fetch';

const lineItemsFragment = `lineItems {
  physicalItems {
    entityId
    parentEntityId
    variantEntityId
    productEntityId
    sku
    name
    url
    imageUrl
    brand
    quantity
    isTaxable
    discounts {
      entityId
      discountedAmount {
        currencyCode
        value
      }
    }
    discountedAmount {
      currencyCode
      value
    }
    couponAmount {
      currencyCode
      value
    }
    listPrice {
      currencyCode
      value
    }
    originalPrice {
      currencyCode
      value
    }
    salePrice {
      currencyCode
      value
    }
    extendedListPrice {
      currencyCode
      value
    }
    extendedSalePrice {
      currencyCode
      value
    }
    isShippingRequired
    selectedOptions {
      entityId
      name
      ... on CartSelectedCheckboxOption {
        value
        valueEntityId
      }
      ... on CartSelectedDateFieldOption {
        date {
          utc
        }
      }
      ... on CartSelectedFileUploadOption {
        fileName
      }
      ... on CartSelectedMultiLineTextFieldOption {
        text
      }
      ... on CartSelectedMultipleChoiceOption {
        value
        valueEntityId
      }
      ... on CartSelectedNumberFieldOption {
        number
      }
      ... on CartSelectedTextFieldOption {
        text
      }
    }
    giftWrapping {
      name
      amount {
        currencyCode
        value
      }
      message
    }
  }
  digitalItems {
    entityId
    parentEntityId
    variantEntityId
    productEntityId
    sku
    name
    url
    imageUrl
    brand
    quantity
    isTaxable
    discounts {
      entityId
      discountedAmount {
        currencyCode
        value
      }
    }
    discountedAmount {
      currencyCode
      value
    }
    couponAmount {
      currencyCode
      value
    }
    listPrice {
      currencyCode
      value
    }
    originalPrice {
      currencyCode
      value
    }
    salePrice {
      currencyCode
      value
    }
    extendedListPrice {
      currencyCode
      value
    }
    extendedSalePrice {
      currencyCode
      value
    }
    selectedOptions {
      entityId
      name
      ... on CartSelectedCheckboxOption {
        value
        valueEntityId
      }
      ... on CartSelectedDateFieldOption {
        date {
          utc
        }
      }
      ... on CartSelectedFileUploadOption {
        fileName
      }
      ... on CartSelectedMultiLineTextFieldOption {
        text
      }
      ... on CartSelectedMultipleChoiceOption {
        value
        valueEntityId
      }
      ... on CartSelectedNumberFieldOption {
        number
      }
      ... on CartSelectedTextFieldOption {
        text
      }
    }
  }
  giftCertificates {
    entityId
    name
    theme
    amount {
      currencyCode
      value
    }
    isTaxable
    sender {
      name
      email
    }
    recipient {
      name
      email
    }
    message
  }
  customItems {
    entityId
    sku
    name
    quantity
    listPrice {
      currencyCode
      value
    }
    extendedListPrice {
      currencyCode
      value
    }
  }
}`;

const getCartInfo = `query getCart($entityId: String) {
  site {
    cart(entityId: $entityId) {
      entityId
      currencyCode
      isTaxIncluded
      baseAmount {
        currencyCode
        value
      }
      discountedAmount {
        currencyCode
        value
      }
      amount {
        currencyCode
        value
      }
      discounts {
        entityId
        discountedAmount {
          currencyCode
          value
        }
      }
      ${lineItemsFragment}
      createdAt {
        utc
      }
      updatedAt {
        utc
      }
      locale
    }
  }
}
`;

const createCart = `mutation createCartSimple($createCartInput: CreateCartInput!) {
  cart {
    createCart(input: $createCartInput) {
      cart {
        entityId
        lineItems {
          physicalItems {
            name
            quantity
          }
          digitalItems {
            name
            quantity
          }
          giftCertificates {
            name
          }
          customItems {
            name
            quantity
          }
        }
      }
    }
  }
}`;

const addLineItemToCart = `mutation addCartLineItemsTwo($addCartLineItemsInput: AddCartLineItemsInput!) {
  cart {
      addCartLineItems(input: $addCartLineItemsInput) {
        cart {
          entityId
        }}}}`;

const deleteCartQuery = `mutation DeleteCart($deleteCartInput: DeleteCartInput!) {
  cart {
    deleteCart(input: $deleteCartInput) {
      deletedCartEntityId
    }
  }
}`;

export interface GetCart {
  data: {
    site: {
      cart: null | {
        entityId: string;
        currencyCode: string;
        isTaxIncluded: boolean;
        baseAmount: {
          currencyCode: string;
          value: number;
        };
        discountedAmount: {
          currencyCode: string;
          value: number;
        };
        amount: {
          currencyCode: string;
          value: number;
        };
        discounts: Array<{
          entityId: string;
          discountedAmount: {
            currencyCode: string;
            value: number;
          };
        }>;
        lineItems: {
          physicalItems: LineItem[];
          digitalItems: LineItem[];
          giftCertificates: LineItem[];
          customItems: LineItem[];
        };
        locale: string;
      };
    };
  };
}

export const getCart = async (cartId?: string): Promise<GetCart> => {
  if (platform === 'bigcommerce') {
    const cartInfo = await B3Request.graphqlBC({
      query: getCartInfo,
    });

    if (cartInfo.data.site.cart?.entityId) {
      Cookies.set('cartId', cartInfo.data.site.cart.entityId);
    }

    return cartInfo;
  }

  const entityId = cartId || Cookies.get('cartId');
  const cartInfo = await B3Request.graphqlBCProxy({
    query: getCartInfo,
    variables: { entityId },
  });
  if (cartInfo.data.site.cart?.entityId) {
    Cookies.set('cartId', cartInfo.data.site.cart.entityId);
  }

  return cartInfo;
};

export const createNewCart = (data: CreateCartInput): any =>
  platform === 'bigcommerce'
    ? B3Request.graphqlBC({
        query: createCart,
        variables: data,
      })
    : B3Request.graphqlBCProxy({
        query: createCart,
        variables: data,
      });

export const addNewLineToCart = (data: any): any =>
  platform === 'bigcommerce'
    ? B3Request.graphqlBC({
        query: addLineItemToCart,
        variables: data,
      })
    : B3Request.graphqlBCProxy({
        query: addLineItemToCart,
        variables: data,
      });

export const deleteCart = (data: DeleteCartInput): any =>
  platform === 'bigcommerce'
    ? B3Request.graphqlBC({
        query: deleteCartQuery,
        variables: data,
      })
    : B3Request.graphqlBCProxy({
        query: deleteCartQuery,
        variables: data,
      });
