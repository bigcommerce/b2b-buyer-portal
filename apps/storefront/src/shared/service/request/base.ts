import { Environment, EnvSpecificConfig } from '@/types';

const ENVIRONMENT_B2B_API_URL: EnvSpecificConfig<string> = {
  local: import.meta.env.VITE_B2B_URL ?? 'http://localhost:9000',
  integration: 'https://api-b2b.integration.zone',
  staging: 'https://api-b2b.staging.zone',
  production: 'https://api-b2b.bigcommerce.com',
};

// cspell:disable
const ENVIRONMENT_B2B_APP_CLIENT_ID: EnvSpecificConfig<string> = {
  local: import.meta.env.VITE_LOCAL_APP_CLIENT_ID ?? 'dl7c39mdpul6hyc489yk0vzxl6jesyx',
  integration: 'leg40ozqqvl0r08spvs0viatax4egbz',
  staging: 'sp4zailqe8uiep5ewafez3tc2emopz8',
  production: 'dl7c39mdpul6hyc489yk0vzxl6jesyx',
};
// cspell:enable

const DEFAULT_ENVIRONMENT =
  import.meta.env.VITE_IS_LOCAL_ENVIRONMENT === 'TRUE' ? Environment.Local : Environment.Production;

function isEnvironment(value?: string): value is Environment {
  if (!value) {
    return false;
  }

  return Object.values<string>(Environment).includes(value);
}

const getEnvironment = (environment?: Environment): Environment => {
  if (environment) {
    return environment;
  }

  if (isEnvironment(window.B3?.setting?.environment)) {
    return window.B3.setting.environment;
  }

  return DEFAULT_ENVIRONMENT;
};

export function getAPIBaseURL(environment?: Environment) {
  return ENVIRONMENT_B2B_API_URL[getEnvironment(environment)];
}

export function getAppClientId(environment?: Environment) {
  return ENVIRONMENT_B2B_APP_CLIENT_ID[getEnvironment(environment)];
}

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

export { queryParse, RequestType };
