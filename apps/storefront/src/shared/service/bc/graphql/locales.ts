import { storefrontGQLRequest } from './client';

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

const getLocales = () => storefrontGQLRequest<LocalesResponse>({ query: getLocalesQuery });

export default getLocales;
