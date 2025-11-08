import { z } from 'zod';

import { platform } from '@/utils';

import B3Request from '../../request/b3Fetch';

const taxDisplayTypeEnumSchema = z.enum(['INC', 'EXC', 'BOTH']);

const storefrontTaxDisplayTypeSchema = z.object({
  pdp: taxDisplayTypeEnumSchema,
  plp: taxDisplayTypeEnumSchema,
});

type StorefrontTaxDisplayType = z.infer<typeof storefrontTaxDisplayTypeSchema>;

const queryGetTaxDisplayType = `query getTaxDisplayType {
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
  const response =
    platform === 'bigcommerce'
      ? await B3Request.graphqlBC({
          query: queryGetTaxDisplayType,
        })
      : await B3Request.graphqlBCProxy({
          query: queryGetTaxDisplayType,
        });

  return storefrontTaxDisplayTypeSchema.parse(response.data.site.settings.tax);
};
