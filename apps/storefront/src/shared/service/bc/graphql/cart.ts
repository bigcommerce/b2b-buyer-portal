import { CreateCartInput, DeleteCartInput } from '@/types/cart'

import B3Request from '../../request/b3Fetch'

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
}`

const getCartInfoForHeadless = `query getCart($entityId: String!) {
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
`

const getCartInfo = `query getCart {
  site {
    cart {
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
`

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
}`

const addLineItemToCart = `mutation addCartLineItemsTwo($addCartLineItemsInput: AddCartLineItemsInput!) {
  cart {
      addCartLineItems(input: $addCartLineItemsInput) {
        cart {
          entityId
        }}}}`

const deleteCartQuery = `mutation deleteCart($deleteCartInput: DeleteCartInput!) {
  cart {
    deleteCart(input: $deleteCartInput) {
      deletedCartEntityId
    }
  }
}`

export const getCart = (entityId: string | null, platform: string): any =>
  platform === 'bigcommerce'
    ? B3Request.graphqlBC({
        // for stencil not using proxy
        query: getCartInfo,
      })
    : B3Request.graphqlBCProxy(
        {
          // for headless using proxy
          query: getCartInfoForHeadless,
          variables: { entityId },
        },
        true
      )

export const createNewCart = (data: CreateCartInput): any =>
  B3Request.graphqlBC({
    query: createCart,
    variables: data,
  })

export const addNewLineToCart = (data: any, platform: string): any =>
  platform === 'bigcommerce'
    ? B3Request.graphqlBC({
        // for stencil not using proxy
        query: addLineItemToCart,
        variables: data,
      })
    : B3Request.graphqlBCProxy(
        {
          // for headless using proxy
          query: addLineItemToCart,
          variables: data,
        },
        true
      )

export const deleteCart = (data: DeleteCartInput): any =>
  B3Request.graphqlBC({
    query: deleteCartQuery,
    variables: data,
  })
