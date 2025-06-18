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

const duplicateShoppingList = (
  fn: string,
) => `mutation DuplicateB2BShoppingList($sampleShoppingListId: Int!, $shoppingListData: ShoppingListsDuplicateInputType!){
  ${fn}(
    sampleShoppingListId: $sampleShoppingListId
    shoppingListData: $shoppingListData
  ) {
    ${getShoppingListInfo}
  }
}`;

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
