import B3Request from '@/shared/service/request/b3Fetch';

const createShoppingList = `
  mutation CreateShoppingList ($shoppingListData: ShoppingListsInputType!){
    shoppingListsCreate (
      shoppingListData: $shoppingListData
    ) {
      shoppingList {
        id,
      }
    }
  }
`;

interface CreateShoppingListResponse {
  data: {
    shoppingListsCreate: {
      shoppingList: {
        id: string;
      };
    };
  };
}

interface CreateShoppingListVariables {
  name: string;
  description: string;
  status: number;
}

export const createB2BShoppingList = (data: CreateShoppingListVariables) =>
  B3Request.graphqlB2B<CreateShoppingListResponse>({
    query: createShoppingList,
    variables: { shoppingListData: data },
  });
