import { z } from 'zod';

import { storefrontGQLRequest } from './client';

const taxDisplayTypeEnumSchema = z.enum(['INC', 'EX', 'BOTH']);

const storefrontTaxDisplayTypeSchema = z.object({
  pdp: taxDisplayTypeEnumSchema,
  plp: taxDisplayTypeEnumSchema,
});

type StorefrontTaxDisplayType = z.infer<typeof storefrontTaxDisplayTypeSchema>;

const queryGetTaxDisplayType = `query GetTaxDisplayType {
  site{
    settings{
      tax{
        pdp
        plp
      }
    }
  }
}`;

export const getStorefrontTaxDisplayType = async (): Promise<StorefrontTaxDisplayType> => {
  const response = await storefrontGQLRequest({
    query: queryGetTaxDisplayType,
  });

  return storefrontTaxDisplayTypeSchema.parse(response.data.site.settings.tax);
};
