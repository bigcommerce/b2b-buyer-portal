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

const createShoppingList = (
  fn: string,
) => `mutation CreateShoppingList ($shoppingListData: ShoppingListsInputType!){
  ${fn}(
    shoppingListData: $shoppingListData
  ) {
    ${getShoppingListInfo}
  }
}`;

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
