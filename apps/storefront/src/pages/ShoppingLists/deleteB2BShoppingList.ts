import B3Request from '@/shared/service/request/b3Fetch';

const deleteShoppingList = (id: number) => `mutation DeleteShoppingList {
  shoppingListsDelete(id: ${id}) {
    message
  }
}`;

export const deleteB2BShoppingList = (id: number) =>
  B3Request.graphqlB2B({
    query: deleteShoppingList(id),
  });
