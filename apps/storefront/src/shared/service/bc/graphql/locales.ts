import { platform } from '@/utils/basicConfig';

import B3Request from '../../request/b3Fetch';

interface Locale {
  code: string;
  isDefault: boolean;
  fullPath: string;
}

interface LocalesResponse {
  data: {
    site: {
      settings: {
        locales: Locale[];
      };
    };
  };
}

const getLocalesQuery = `
query GetLocales {
  site {
    settings {
      locales {
        code
        isDefault
        fullPath
      }
    }
  }
}`;

export const getLocales = (): Promise<Locale[]> => {
  const request =
    platform === 'bigcommerce'
      ? B3Request.graphqlBC<LocalesResponse>({ query: getLocalesQuery })
      : B3Request.graphqlBCProxy<LocalesResponse>({ query: getLocalesQuery });

  return request.then((res) => res.data.site.settings.locales);
};
