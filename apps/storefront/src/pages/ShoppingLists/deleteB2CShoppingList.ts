import B3Request from '@/shared/service/request/b3Fetch';

const deleteCustomerShoppingList = (id: number) => `mutation DeleteCustomerShoppingList {
  customerShoppingListsDelete (id: ${id}) {
    message
  }
}`;

export const deleteBcShoppingList = (id: number) =>
  B3Request.graphqlB2B({
    query: deleteCustomerShoppingList(id),
  });
