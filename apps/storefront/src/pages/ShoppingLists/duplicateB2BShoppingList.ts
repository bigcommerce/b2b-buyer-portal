import B3Request from '@/shared/service/request/b3Fetch';

const duplicateShoppingList = `
  mutation DuplicateB2BShoppingList($sampleShoppingListId: Int!, $shoppingListData: ShoppingListsDuplicateInputType!){
    shoppingListsDuplicate(sampleShoppingListId: $sampleShoppingListId, shoppingListData: $shoppingListData) {
      shoppingList {
        id,
      }
    }
  }
`;

interface DuplicateB2BShoppingListResponse {
  shoppingListsDuplicate: {
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

export const duplicateB2BShoppingList = (data: ShoppingListVariables) =>
  B3Request.graphqlB2B<DuplicateB2BShoppingListResponse>({
    query: duplicateShoppingList,
    variables: {
      sampleShoppingListId: Number(data.sampleShoppingListId),
      shoppingListData: {
        name: data.name,
        description: data.description,
      },
    },
  });
