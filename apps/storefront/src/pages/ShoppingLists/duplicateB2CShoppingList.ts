import B3Request from '@/shared/service/request/b3Fetch';

const duplicateCustomerShoppingList = `
  mutation DuplicateB2CShoppingList($sampleShoppingListId: Int!, $shoppingListData: ShoppingListsDuplicateInputType!){
    customerShoppingListsDuplicate(sampleShoppingListId: $sampleShoppingListId, shoppingListData: $shoppingListData) {
      shoppingList {
        id,
      }
    }
  }
`;

interface DuplicateB2CShoppingListResponse {
  customerShoppingListsDuplicate: {
    shoppingList: {
      id: number;
    };
  };
}

interface ShoppingListVariables {
  sampleShoppingListId: string | number;
  name: string;
  description: string;
}

export const duplicateB2CShoppingList = (data: ShoppingListVariables) =>
  B3Request.graphqlB2B<DuplicateB2CShoppingListResponse>({
    query: duplicateCustomerShoppingList,
    variables: {
      sampleShoppingListId: Number(data.sampleShoppingListId),
      shoppingListData: {
        name: data.name,
        description: data.description,
      },
    },
  });
