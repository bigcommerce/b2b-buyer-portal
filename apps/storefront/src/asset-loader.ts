import { Environment, EnvSpecificConfig } from '@/types';

// TODO: update the following to BC cdn when migration is completed
const ENVIRONMENT_ASSET_PATH: EnvSpecificConfig<string> = {
  local: '/',
  integration: 'https://microapp-cdn.gcp.integration.zone/b2b-buyer-portal/',
  staging: 'https://cdn.bundleb2b.net/b2b/staging/storefront/assets/',
  production: 'https://cdn.bundleb2b.net/b2b/production/storefront/assets/',
};

window.b2b = {
  ...window.b2b,
  __get_asset_location: (filename) => {
    // this function is called at runtime and intentionally references `window.B3`
    // so that the same runtime files can dynamically choose the cdn base url location
    // based on environment it is deployed to
    const environment: Environment = window.B3?.setting?.environment ?? Environment.Production;
    return `${ENVIRONMENT_ASSET_PATH[environment]}${filename}`;
  },
};
