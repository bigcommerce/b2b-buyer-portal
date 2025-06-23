import { Environment, EnvSpecificConfig } from '@/types';

// TODO: update the following to BC cdn when migration is completed
const ENVIRONMENT_CDN_BASE_PATH: EnvSpecificConfig<string> = {
  local: '/',
  integration: 'https://microapps.integration.zone/b2b-buyer-portal/',
  staging: 'https://microapps.staging.zone/b2b-buyer-portal/',
  production: 'https://cdn.bundleb2b.net/b2b/production/storefront/',
};

window.b2b = {
  ...window.b2b,
  __get_asset_location: (filename) => {
    // this function is called at runtime and intentionally references `window.B3`
    // so that the same runtime files can dynamically choose the cdn base url location
    // based on environment it is deployed to
    const environment: Environment = window.B3?.setting?.environment ?? Environment.Production;
    return `${ENVIRONMENT_CDN_BASE_PATH[environment]}${filename}`;
  },
};

(async function bootstrap() {
  const { bindLinks, initApp, requestIdleCallbackFunction, unbindLinks } = await import(
    './load-functions'
  );

  // check if the accessed url contains a hashtag
  if (window.location.hash.startsWith('#/')) {
    initApp();
  } else {
    // load the app when the browser is free
    requestIdleCallbackFunction(initApp);
    // and bind links to load the app
    bindLinks();
    window.addEventListener('beforeunload', unbindLinks);
    // and observe global flag to simulate click
    window.b2b.initializationEnvironment.isInitListener = () => {
      unbindLinks();
      setTimeout(() => window.b2b.initializationEnvironment.clickedLinkElement?.click(), 0);
    };
  }
})();
