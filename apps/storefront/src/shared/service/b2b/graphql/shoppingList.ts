import { ShoppingListStatus } from '@/types/shoppingList';
import { convertArrayToGraphql, convertObjectToGraphql } from '@/utils';

import B3Request from '../../request/b3Fetch';

interface ShoppingListParams {
  id: string | number;
  sampleShoppingListId: string | number;
  name: string;
  description: string;
  status: number;
  channelId: number;
  companyId: number;
}

const getStatus = (status: any): string => {
  if (typeof status === 'number') {
    // Status code 20 was previously misused as Rejected in the frontend, which is actually Deleted
    // Now when we want to fetch rejected shopping lists, we need to fetch deleted ones as well
    if (status === ShoppingListStatus.Rejected) {
      return `status: [${ShoppingListStatus.Deleted}, ${ShoppingListStatus.Rejected}]`;
    }

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
}) => ` query B2BCustomerShoppingLists {
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
        approvedFlag,
        companyInfo {
          companyId,
          companyName,
          companyAddress,
          companyCountry,
          companyState,
          companyCity,
          companyZipCode,
          phoneNumber,
          bcId,
        },
      }
    }
  }
}`;

const getShoppingListInfo = `shoppingList {
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
  companyInfo {
    companyId,
    companyName,
    companyAddress,
    companyCountry,
    companyState,
    companyCity,
    companyZipCode,
    phoneNumber,
    bcId,
  },
}`;

const updateShoppingList = (fn: string) => `
  mutation UpdateB2BShoppingList ($id: Int!, $shoppingListData: ShoppingListsInputType!) {
    ${fn}(
      id: $id
      shoppingListData: $shoppingListData
    ) {
      ${getShoppingListInfo}
    }
  }
`;

const createShoppingList = (fn: string) => `mutation($shoppingListData: ShoppingListsInputType!){
  ${fn}(
    shoppingListData: $shoppingListData
  ) {
    ${getShoppingListInfo}
  }
}`;

const duplicateShoppingList = (
  fn: string,
) => `mutation($sampleShoppingListId: Int!, $shoppingListData: ShoppingListsDuplicateInputType!){
  ${fn}(
    sampleShoppingListId: $sampleShoppingListId
    shoppingListData: $shoppingListData
  ) {
    ${getShoppingListInfo}
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

export interface CustomerShoppingListB2B {
  data: {
    shoppingList: {
      id: string;
      createdAt: number;
      updatedAt: number;
      name: string;
      description: string;
      status: number;
      reason: string | null;
      customerInfo: {
        firstName: string;
        lastName: string;
        userId: number;
        email: string;
        role: string;
      };
      isOwner: boolean;
      grandTotal: string;
      totalDiscount: string;
      totalTax: string;
      isShowGrandTotal: boolean;
      channelId: string | null;
      channelName: string;
      approvedFlag: boolean;
      companyInfo: {
        companyId: string;
        companyName: string;
        companyAddress: string;
        companyCountry: string;
        companyState: string;
        companyCity: string;
        companyZipCode: string;
        phoneNumber: string;
        bcId: string;
      };
      products: {
        totalCount: number;
        edges: Array<{
          node: {
            id: string;
            createdAt: number;
            updatedAt: number;
            productId: number;
            variantId: number;
            quantity: number;
            productName: string;
            optionList: string;
            itemId: number;
            baseSku: string;
            variantSku: string;
            basePrice: string;
            discount: string;
            tax: string;
            enteredInclusive: boolean;
            productUrl: string;
            primaryImage: string;
            productNote: string;
          };
        }>;
      };
    };
  };
}

const getShoppingListDetails = (data: CustomFieldItems) => `
  query B2BShoppingListDetails {
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
      companyInfo {
        companyId,
        companyName,
        companyAddress,
        companyCountry,
        companyState,
        companyCity,
        companyZipCode,
        phoneNumber,
        bcId,
      },
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
  }
`;

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

const getCustomerShoppingLists = ({
  offset = 0,
  first = 50,
  search = '',
  channelId = 1,
}) => `query CustomerShoppingLists {
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

const getCustomerShoppingListInfo = `
shoppingList {
  id,
  name,
  description,
  grandTotal,
  totalDiscount,
  totalTax,
  isShowGrandTotal,
}`;

const updateCustomerShoppingList = (
  fn: string,
) => `mutation($id: Int!, $shoppingListData: CustomerShoppingListsInputType!){
  ${fn}(
    id: $id
    shoppingListData: $shoppingListData
  ) {
    ${getCustomerShoppingListInfo}
  }
}`;

const createCustomerShoppingList = (
  fn: string,
) => `mutation($shoppingListData: CustomerShoppingListsInputType!){
  ${fn}(
    shoppingListData: $shoppingListData
  ) {
    ${getCustomerShoppingListInfo}
  }
}`;

const duplicateCustomerShoppingList = (
  fn: string,
) => `mutation($sampleShoppingListId: Int!, $shoppingListData: ShoppingListsDuplicateInputType!){
  ${fn}(
    sampleShoppingListId: $sampleShoppingListId
    shoppingListData: $shoppingListData
  ) {
    ${getCustomerShoppingListInfo}
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

const getCreatedByUser = (companyId: number, module: number, fn: string) => `
  query GetShoppingListsCreatedByUser {
    ${fn}(
      companyId: ${companyId},
      module: ${module},
    ){
      results,
    }
  }
`;

export const getB2BShoppingList = (data: CustomFieldItems = {}) =>
  B3Request.graphqlB2B({
    query: getShoppingList(data),
  }).then((res) => res.shoppingLists);

export const createB2BShoppingList = (data: Partial<ShoppingListParams>) =>
  B3Request.graphqlB2B({
    query: createShoppingList('shoppingListsCreate'),
    variables: {
      shoppingListData: {
        companyId: data.companyId,
        name: data.name,
        description: data.description,
        status: data.status,
      },
    },
  });

export const updateB2BShoppingList = (data: Partial<ShoppingListParams>) =>
  B3Request.graphqlB2B({
    query: updateShoppingList('shoppingListsUpdate'),
    variables: {
      id: data?.id ? Number(data.id) : 1,
      shoppingListData: {
        name: data.name,
        description: data.description,
        status: data.status,
      },
    },
  });

export const duplicateB2BShoppingList = (data: Partial<ShoppingListParams>) =>
  B3Request.graphqlB2B({
    query: duplicateShoppingList('shoppingListsDuplicate'),
    variables: {
      sampleShoppingListId: data?.sampleShoppingListId ? Number(data.sampleShoppingListId) : 1,
      shoppingListData: {
        name: data.name,
        description: data.description,
        status: data.status,
      },
    },
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

export const createBcShoppingList = (data: Partial<ShoppingListParams>) =>
  B3Request.graphqlB2B({
    query: createCustomerShoppingList('customerShoppingListsCreate'),
    variables: {
      shoppingListData: {
        name: data.name,
        description: data.description,
        channelId: data?.channelId ? Number(data.channelId) : 1,
      },
    },
  });

export const updateBcShoppingList = (data: Partial<ShoppingListParams>) =>
  B3Request.graphqlB2B({
    query: updateCustomerShoppingList('customerShoppingListsUpdate'),
    variables: {
      id: data?.id ? Number(data.id) : 1,
      shoppingListData: {
        name: data.name,
        description: data.description,
        channelId: data?.channelId ? Number(data.channelId) : 1,
      },
    },
  });

export const duplicateBcShoppingList = (data: Partial<ShoppingListParams>) =>
  B3Request.graphqlB2B({
    query: duplicateCustomerShoppingList('customerShoppingListsDuplicate'),
    variables: {
      sampleShoppingListId: data?.sampleShoppingListId ? Number(data.sampleShoppingListId) : 1,
      shoppingListData: {
        name: data.name,
        description: data.description,
      },
    },
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

export interface ShoppingListsCreatedByUser {
  data: {
    createdByUser: {
      results: {
        createdBy: {
          name: string;
          email: string;
        }[];
        salesRep: unknown[];
      };
    };
  };
}

export const getShoppingListsCreatedByUser = (companyId: number, module: number) =>
  B3Request.graphqlB2B({
    query: getCreatedByUser(companyId, module, 'createdByUser'),
  });
