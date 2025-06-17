import B3Request from '@/shared/service/request/b3Fetch';

interface ShoppingListParams {
  id: string | number;
  sampleShoppingListId: string | number;
  name: string;
  description: string;
  status: number;
  channelId: number;
  companyId: number;
}

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

const createCustomerShoppingList = (
  fn: string,
) => `mutation CreateCustomerShoppingList ($shoppingListData: CustomerShoppingListsInputType!){
  ${fn}(
    shoppingListData: $shoppingListData
  ) {
    ${getCustomerShoppingListInfo}
  }
}`;

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
