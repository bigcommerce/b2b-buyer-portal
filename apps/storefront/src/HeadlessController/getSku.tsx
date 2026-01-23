import { z } from 'zod';

import B3Request from '@/shared/service/request/b3Fetch';
import { LineItem } from '@/utils/b3Product/b3Product';
import { platform } from '@/utils/basicConfig';

const Options = z.array(
  z.object({
    optionEntityId: z.number(),
    valueEntityId: z.number(),
  }),
);

interface ProductsWithOptionSelections {
  data: {
    site: {
      productWithSelectedOptions: {
        sku: string;
      };
    };
  };
}

const graphqlRequest: typeof B3Request.graphqlBC | typeof B3Request.graphqlBCProxy = ({
  query,
  variables,
}) =>
  platform === 'bigcommerce'
    ? B3Request.graphqlBC({ query, variables })
    : B3Request.graphqlBCProxy({ query, variables });

export const getSku = async ({
  selectedOptions = [],
  productEntityId,
}: LineItem): Promise<string> => {
  const { data } = await graphqlRequest<ProductsWithOptionSelections>({
    query: `
    query ProductsWithOptionSelections (
      $productId: Int!,
      $optionValueIds: [OptionValueId!]
    ) {
      site {
        productWithSelectedOptions: product(
          entityId: $productId
          optionValueIds: $optionValueIds
        ) {
          sku
        }
      }
    }`,
    variables: {
      productId: productEntityId,
      optionValueIds: Options.parse(selectedOptions),
    },
  });

  return data.site.productWithSelectedOptions.sku;
};
