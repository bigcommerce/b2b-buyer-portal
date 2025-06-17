import B3Request from '@/shared/service/request/b3Fetch';

const createCustomerShoppingList = `
  mutation CreateCustomerShoppingList($shoppingListData: CustomerShoppingListsInputType!) {
    customerShoppingListsCreate(shoppingListData: $shoppingListData) {
      shoppingList {
        id,
      }
    }
  }
`;

interface CreateCustomerShoppingListResponse {
  data: {
    customerShoppingListsCreate: {
      shoppingList: {
        id: string;
      };
    };
  };
}

interface ShoppingListParams {
  name: string;
  description: string;
  channelId: number;
}

export const createBcShoppingList = (data: ShoppingListParams) =>
  B3Request.graphqlB2B<CreateCustomerShoppingListResponse>({
    query: createCustomerShoppingList,
    variables: {
      shoppingListData: {
        name: data.name,
        description: data.description,
        channelId: data?.channelId ? Number(data.channelId) : 1,
      },
    },
  });
