import { convertArrayToGraphql, convertObjectToGraphql } from '@/utils';

import B3Request from '../../request/b3Fetch';

const getStatus = (status: any): string => {
  if (typeof status === 'number') {
    return `status: ${status}`;
  }
  if (typeof status === 'object') {
    return `status: [${status}]`;
  }
  return '';
};

const getShoppingList = ({
  offset = 0,
  first = 50,
  status = '',
  createdBy = '',
  email = '',
  search = '',
  isDefault = true,
}) => `{
  shoppingLists (
    offset: ${offset}
    first: ${first}
    search: "${search}"
    createdBy: "${createdBy}"
    email: "${email}"
    ${getStatus(status)}
    isDefault: ${isDefault}
  ){
    totalCount,
    pageInfo{
      hasNextPage,
      hasPreviousPage,
    },
    edges{
      node{
        id,
        name,
        description,
        status,
        customerInfo{
          firstName,
          lastName,
          userId,
          email,
          role,
        },
        updatedAt,
        isOwner,
        products {
          totalCount,
        }
        approvedFlag
      }
    }
  }
}`;

const createOrUpdateShoppingList = (fn: string, data: CustomFieldItems) => `mutation{
  ${fn}(
    ${!data?.id ? '' : `id: ${data.id}`}
    ${!data?.sampleShoppingListId ? '' : `sampleShoppingListId: ${data.sampleShoppingListId}`}
    shoppingListData: {
      name: "${data.name}",
      description: "${data.description}",
      ${typeof data?.status === 'number' ? `status: ${data.status}` : ''}
  }) {
    shoppingList {
      id,
      name,
      description,
      status,
      approvedFlag,
      customerInfo{
        firstName,
        lastName,
        userId,
        email,
      },
      isOwner,
      grandTotal,
      totalDiscount,
      totalTax,
      isShowGrandTotal,
    }
  }
}`;

const deleteShoppingList = (id: number) => `mutation{
  shoppingListsDelete(id: ${id}) {
    message
  }
}`;

const updateShoppingListsItem = (data: CustomFieldItems) => `mutation {
  shoppingListsItemsUpdate(
    itemId: ${data.itemId}
    shoppingListId: ${data.shoppingListId}
    itemData: ${convertObjectToGraphql(data.itemData || [])}
  ) {
    shoppingListsItem {
      id,
      createdAt,
      updatedAt,
      productId,
      variantId,
      quantity,
      productName,
      optionList,
      itemId,
      baseSku,
      variantSku,
      basePrice,
      discount,
      tax,
      enteredInclusive,
      productUrl,
      primaryImage,
      productNote,
    }
  }
}`;

const getShoppingListDetails = (data: CustomFieldItems) => `{
  shoppingList (
    id: ${data.id}
  ) {
    id,
    createdAt,
    updatedAt,
    name,
    description,
    status,
    reason,
    customerInfo {
      firstName,
      lastName,
      userId,
      email,
      role,
    },
    isOwner,
    grandTotal,
    totalDiscount,
    totalTax,
    isShowGrandTotal,
    channelId,
    channelName,
    approvedFlag,
    products (
      offset: ${data.offset || 0}
      first: ${data.first || 100},
      search: "${data.search || ''}",
      orderBy: "${data?.orderBy || '-updatedAt'}"
    ) {
      totalCount,
      edges {
        node {
          id,
          createdAt,
          updatedAt,
          productId,
          variantId,
          quantity,
          productName,
          optionList,
          itemId,
          baseSku,
          variantSku,
          basePrice,
          discount,
          tax,
          enteredInclusive,
          productUrl,
          primaryImage,
          productNote,
        }
      }
    }
  }
}`;

const addItemsToShoppingList = (data: CustomFieldItems) => `mutation {
  shoppingListsItemsCreate(
    shoppingListId: ${data.shoppingListId},
    items: ${convertArrayToGraphql(data.items || [])}
  ) {
    shoppingListsItems {
      id,
      createdAt,
      updatedAt,
      productId,
      variantId,
      quantity,
      productName,
      optionList,
      itemId,
      baseSku,
      variantSku,
      basePrice,
      discount,
      tax,
      enteredInclusive,
      productUrl,
      primaryImage,
    }
  }
}`;

const deleteShoppingListItem = (data: CustomFieldItems) => `mutation {
  shoppingListsItemsDelete(
    itemId: ${data.itemId},
    shoppingListId: ${data.shoppingListId},
  ) {
    message,
  }
}`;

const getCustomerShoppingLists = ({ offset = 0, first = 50, search = '', channelId = 1 }) => `{
  customerShoppingLists (
    offset: ${offset}
    first: ${first}
    search: "${search}"
    channelId: ${channelId}
  ){
    totalCount,
    pageInfo{
      hasNextPage,
      hasPreviousPage,
    },
    edges{
      node{
        id,
        name,
        description,
        updatedAt,
        products {
          totalCount,
        }
      }
    }
  }
}`;

const createOrUpdateCustomerShoppingList = (fn: string, data: CustomFieldItems) => `mutation {
  ${fn}(
    ${!data?.id ? '' : `id: ${data.id}`}
    ${!data?.sampleShoppingListId ? '' : `sampleShoppingListId: ${data.sampleShoppingListId}`}
    shoppingListData: {
      name: "${data.name}",
      description: "${data.description}",
      ${!data?.channelId ? '' : `channelId: ${data.channelId}`}
  }) {
    shoppingList {
      id,
      name,
      description,
      grandTotal,
      totalDiscount,
      totalTax,
      isShowGrandTotal,
    }
  }
}`;

const deleteCustomerShoppingList = (id: number) => `mutation{
  customerShoppingListsDelete (id: ${id}) {
    message
  }
}`;

const getCustomerShoppingListDetails = (data: CustomFieldItems) => `{
  customerShoppingList (
    id: ${data.id}
  ) {
    id,
    createdAt,
    updatedAt,
    name,
    description,
    reason,
    grandTotal,
    totalDiscount,
    totalTax,
    isShowGrandTotal,
    channelId,
    channelName,
    products (
      offset: ${data.offset || 0}
      first: ${data.first || 100},
      search: "${data.search || ''}",
    ) {
      totalCount,
      edges {
        node {
          id,
          createdAt,
          updatedAt,
          productId,
          variantId,
          quantity,
          productName,
          optionList,
          itemId,
          baseSku,
          variantSku,
          basePrice,
          discount,
          tax,
          enteredInclusive,
          productUrl,
          primaryImage,
          productNote,
        }
      }
    }
  }
}`;

const addItemsToBcShoppingList = (data: CustomFieldItems) => `mutation {
  customerShoppingListsItemsCreate (
    shoppingListId: ${data.shoppingListId},
    items: ${convertArrayToGraphql(data.items || [])}
  ) {
    shoppingListsItems {
      id,
      createdAt,
      updatedAt,
      productId,
      variantId,
      quantity,
      productName,
      optionList,
      itemId,
      baseSku,
      variantSku,
      basePrice,
      discount,
      tax,
      enteredInclusive,
      productUrl,
      primaryImage,
    }
  }
}`;

const updateCustomerShoppingListsItem = (data: CustomFieldItems) => `mutation {
  customerShoppingListsItemsUpdate (
    itemId: ${data.itemId}
    shoppingListId: ${data.shoppingListId}
    itemData: ${convertObjectToGraphql(data.itemData || [])}
  ) {
    shoppingListsItem {
      id,
      createdAt,
      updatedAt,
      productId,
      variantId,
      quantity,
      productName,
      optionList,
      itemId,
      baseSku,
      variantSku,
      basePrice,
      discount,
      tax,
      enteredInclusive,
      productUrl,
      primaryImage,
    }
  }
}`;

const deleteCustomerShoppingListItem = (data: CustomFieldItems) => `mutation {
  customerShoppingListsItemsDelete (
    itemId: ${data.itemId},
    shoppingListId: ${data.shoppingListId},
  ) {
    message,
  }
}`;

const getJuniorPlaceOrder = () => `{
  storeConfigSwitchStatus(
    key: "junior_place_order",
  ) {
    id,
    key,
    isEnabled,
  }
}`;

const getCreatedByUser = (companyId: number, module: number, fn: string) => `{
  ${fn}(
    companyId: ${companyId},
    module: ${module},
  ){
    results,
  }
}`;

export const getB2BShoppingList = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: getShoppingList(data),
  }).then((res) => res.shoppingLists);

export const createB2BShoppingList = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: createOrUpdateShoppingList('shoppingListsCreate', data),
  });

export const updateB2BShoppingList = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: createOrUpdateShoppingList('shoppingListsUpdate', data),
  });

export const duplicateB2BShoppingList = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: createOrUpdateShoppingList('shoppingListsDuplicate', data),
  });

export const deleteB2BShoppingList = (id: number) =>
  B3Request.graphqlB2B({
    query: deleteShoppingList(id),
  });

export const getB2BShoppingListDetails = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: getShoppingListDetails(data),
  }).then((res) => res.shoppingList);

export const addProductToShoppingList = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: addItemsToShoppingList(data),
  });

export const updateB2BShoppingListsItem = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: updateShoppingListsItem(data),
  });

export const deleteB2BShoppingListItem = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: deleteShoppingListItem(data),
  });

export const getBcShoppingList = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: getCustomerShoppingLists(data),
  }).then((res) => res.customerShoppingLists);

export const createBcShoppingList = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: createOrUpdateCustomerShoppingList('customerShoppingListsCreate', data),
  });

export const updateBcShoppingList = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: createOrUpdateCustomerShoppingList('customerShoppingListsUpdate', data),
  });

export const duplicateBcShoppingList = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: createOrUpdateCustomerShoppingList('customerShoppingListsDuplicate', data),
  });

export const deleteBcShoppingList = (id: number) =>
  B3Request.graphqlB2B({
    query: deleteCustomerShoppingList(id),
  });

export const getBcShoppingListDetails = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: getCustomerShoppingListDetails(data),
  }).then((res) => res.customerShoppingList);

export const addProductToBcShoppingList = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: addItemsToBcShoppingList(data),
  });

export const updateBcShoppingListsItem = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: updateCustomerShoppingListsItem(data),
  });

export const deleteBcShoppingListItem = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: deleteCustomerShoppingListItem(data),
  });

export const getB2BJuniorPlaceOrder = () =>
  B3Request.graphqlB2B({
    query: getJuniorPlaceOrder(),
  });

export const getShoppingListsCreatedByUser = (companyId: number, module: number) =>
  B3Request.graphqlB2B({
    query: getCreatedByUser(companyId, module, 'createdByUser'),
  });
