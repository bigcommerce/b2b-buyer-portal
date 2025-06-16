import B3Request from '@/shared/service/request/b3Fetch';

const deleteShoppingList = `
  mutation DeleteShoppingList($id: Int!) {
    shoppingListsDelete(id: $id) {
      message
    }
  }
`;

interface DeleteShoppingListResponse {
  data: {
    shoppingListsDelete: {
      message: string;
    };
  };
}

export const deleteB2BShoppingList = (id: number | string) =>
  B3Request.graphqlB2B<DeleteShoppingListResponse>({
    query: deleteShoppingList,
    variables: { id: Number(id) },
  });
