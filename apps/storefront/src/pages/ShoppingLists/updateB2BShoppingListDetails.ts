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
