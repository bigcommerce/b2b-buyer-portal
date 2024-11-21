import { Environment, EnvSpecificConfig } from '@/types';

const ENVIRONMENT_B2B_API_URL: EnvSpecificConfig<string> = {
  local: import.meta.env.VITE_B2B_URL ?? 'http://localhost:9000',
  integration: 'https://api-b2b.integration.zone',
  staging: 'https://api-b2b.staging.zone',
  production: 'https://api-b2b.bigcommerce.com',
};

function getAPIBaseURL() {
  const environment: Environment = window.B3.setting.environment ?? Environment.Production;
  return ENVIRONMENT_B2B_API_URL[environment];
}

const B2B_API_BASE_URL = getAPIBaseURL();

enum RequestType {
  B2BGraphql = 'B2BGraphql',
  BCGraphql = 'BCGraphql',
  BCProxyGraphql = 'BCProxyGraphql',
  B2BRest = 'B2BRest',
  BCRest = 'BCRest',
  TranslationService = 'TranslationService',
}

export type RequestTypeKeys = keyof typeof RequestType;

const queryParse = <T>(query: T): string => {
  let queryText = '';

  Object.keys(query || {}).forEach((key: string) => {
    queryText += `${key}=${(query as any)[key]}&`;
  });
  return queryText.slice(0, -1);
};

export { B2B_API_BASE_URL, queryParse, RequestType };
