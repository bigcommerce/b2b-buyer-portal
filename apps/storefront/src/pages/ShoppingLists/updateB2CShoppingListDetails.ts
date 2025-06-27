import B3Request from '@/shared/service/request/b3Fetch';

const updateCustomerShoppingList = `mutation UpdateB2CShoppingList($id: Int!, $shoppingListData: CustomerShoppingListsInputType!){
  customerShoppingListsUpdate(id: $id, shoppingListData: $shoppingListData) {
    shoppingList {
      id
    }
  }
}`;

interface B2CShoppingListUpdateResponse {
  customerShoppingListsUpdate: {
    shoppingList: {
      id: number;
    };
  };
}

interface ShoppingListVariables {
  id: string | number;
  name: string;
  description: string;
  channelId: number;
}

export const updateB2CShoppingListDetails = (data: ShoppingListVariables) =>
  B3Request.graphqlB2B<B2CShoppingListUpdateResponse>({
    query: updateCustomerShoppingList,
    variables: {
      id: Number(data.id),
      shoppingListData: {
        name: data.name,
        description: data.description,
        channelId: data?.channelId ? Number(data.channelId) : 1,
      },
    },
  });
