import { z } from 'zod';

import B3Request from '@/shared/service/request/b3Fetch';
import { LineItem } from '@/utils/b3Product/b3Product';

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

export const getSku = async ({ selectedOptions, productEntityId }: LineItem): Promise<string> => {
  const { data } = await B3Request.graphqlBCProxy<ProductsWithOptionSelections>({
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
