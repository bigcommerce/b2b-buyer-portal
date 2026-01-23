import { bindLinks, initApp, requestIdleCallbackFunction, unbindLinks } from './load-functions';

export enum Environment {
  Production = 'production',
  Staging = 'staging',
  Integration = 'integration',
  Local = 'local',
}

const getBasePath = (env: string = Environment.Production): string => {
  if (env === Environment.Production) {
    return 'https://microapps.bigcommerce.com/b2b-buyer-portal/';
  }

  if (env === Environment.Staging) {
    return 'https://microapps.staging.zone/b2b-buyer-portal/';
  }

  if (env === Environment.Integration) {
    return 'https://microapps.integration.zone/b2b-buyer-portal/';
  }

  return '/';
};

window.b2b = {
  ...window.b2b,
  __get_asset_location: (filename) => {
    // this function is called at runtime and intentionally references `window.B3`
    // so that the same runtime files can dynamically choose the cdn base url location
    // based on environment it is deployed to
    const basePath = getBasePath(window.B3.setting.environment);

    return `${basePath}${filename}`;
  },
};

(async function bootstrap() {
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
