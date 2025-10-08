import B3Request from '../../request/b3Fetch';

interface OptionSelection {
  option_id: number;
  value_id: number;
}

export interface OptionList {
  id: number;
  option_id: number;
  order_product_id: number;
  product_option_id: number;
  display_name: string;
  display_name_customer: string;
  display_name_merchant: string;
  display_value: string;
  display_value_customer: string;
  display_value_merchant: string;
  value: string;
  type: string;
  name: string;
  display_style: string;
}

export interface OrderedProductNode {
  node: {
    id: string;
    createdAt: number;
    updatedAt: number;
    productName: string;
    productBrandName: string;
    variantSku: string;
    productId: string;
    variantId: string;
    optionList: OptionList[];
    orderedTimes: string;
    firstOrderedAt: number;
    lastOrderedAt: number;
    lastOrderedItems: string;
    sku: string;
    lastOrdered: string;
    imageUrl: string;
    baseSku: string;
    basePrice: string;
    discount: string;
    tax: string;
    enteredInclusive: boolean;
    productUrl: string;
    optionSelections: OptionSelection[];
  };
}

export interface RecentlyOrderedProductsResponse {
  data: {
    orderedProducts: {
      totalCount: number;
      edges: OrderedProductNode[];
    };
  };
}

const orderedProducts = (data: CustomFieldItems) => `
query RecentlyOrderedProducts {
  orderedProducts (
    q: "${data.q || ''}"
    first: ${data.first}
    offset: ${data.offset}
    beginDateAt: "${data.beginDateAt}"
    endDateAt: "${data.endDateAt}"
    orderBy: "${data?.orderBy || ''}"
  ){
    totalCount,
    pageInfo{
      hasNextPage,
      hasPreviousPage,
    },
    edges{
      node {
        id,
        createdAt,
        updatedAt,
        productName,
        productBrandName,
        variantSku,
        productId,
        variantId,
        optionList,
        orderedTimes,
        firstOrderedAt,
        lastOrderedAt,
        lastOrderedItems,
        sku,
        lastOrdered,
        imageUrl,
        baseSku,
        basePrice,
        discount,
        tax,
        enteredInclusive,
        productUrl,
        optionSelections,
      }
    }
  }
}`;

export const getOrderedProducts = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: orderedProducts(data),
  });
