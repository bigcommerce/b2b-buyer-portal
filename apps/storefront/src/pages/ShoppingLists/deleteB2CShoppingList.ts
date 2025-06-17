import B3Request from '@/shared/service/request/b3Fetch';

const deleteCustomerShoppingList = `
  mutation DeleteCustomerShoppingList ($id: Int!) {
    customerShoppingListsDelete (id: $id) {
      message
    }
  }
`;

interface DeleteShoppingListResponse {
  data: {
    customerShoppingListsDelete: {
      message: string;
    };
  };
}

export const deleteBcShoppingList = (id: number | string) =>
  B3Request.graphqlB2B<DeleteShoppingListResponse>({
    query: deleteCustomerShoppingList,
    variables: { id: Number(id) },
  });
