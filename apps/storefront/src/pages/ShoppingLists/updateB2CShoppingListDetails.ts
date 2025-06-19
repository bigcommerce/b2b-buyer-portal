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

const updateCustomerShoppingList = (
  fn: string,
) => `mutation UpdateB2CShoppingList($id: Int!, $shoppingListData: CustomerShoppingListsInputType!){
  ${fn}(
    id: $id
    shoppingListData: $shoppingListData
  ) {
    ${getCustomerShoppingListInfo}
  }
}`;

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
