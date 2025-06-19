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

const duplicateCustomerShoppingList = (
  fn: string,
) => `mutation DuplicateB2CShoppingList($sampleShoppingListId: Int!, $shoppingListData: ShoppingListsDuplicateInputType!){
  ${fn}(
    sampleShoppingListId: $sampleShoppingListId
    shoppingListData: $shoppingListData
  ) {
    ${getCustomerShoppingListInfo}
  }
}`;

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
