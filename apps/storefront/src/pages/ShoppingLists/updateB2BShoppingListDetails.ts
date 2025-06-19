import B3Request from '@/shared/service/request/b3Fetch';

const updateShoppingList = `
  mutation UpdateB2BShoppingList ($id: Int!, $shoppingListData: ShoppingListsInputType!) {
    shoppingListsUpdate(id: $id, shoppingListData: $shoppingListData) {
      shoppingList {
        id
      }
    }
  }
`;

interface B2BShoppingListUpdateResponse {
  shoppingListsUpdate: {
    shoppingList: {
      id: number;
    };
  };
}

interface ShoppingListVariables {
  id: string | number;
  name: string;
  description: string;
  status: number;
}

export const updateB2BShoppingListDetails = (data: ShoppingListVariables) =>
  B3Request.graphqlB2B<B2BShoppingListUpdateResponse>({
    query: updateShoppingList,
    variables: {
      id: Number(data.id),
      shoppingListData: {
        name: data.name,
        description: data.description,
        // passes back original status, not editable in the UI
        status: data.status,
      },
    },
  });
