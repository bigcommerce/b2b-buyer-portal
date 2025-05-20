# Headless Guide

## Running Project Locally

1. Activate store channel in the Channels Manager
2. Make sure that the buyer portal is running `yarn dev`
3. Add the buyer portal scripts to your headless storefront files running locally

- Script for the `<head>` tag

```html
<script type="module">
  import RefreshRuntime from 'http://localhost:3001/@react-refresh'
  RefreshRuntime.injectIntoGlobalHook(window)
  window.$RefreshReg$ = () => {}
  window.$RefreshSig$ = () => (type) => type
  window.__vite_plugin_react_preamble_installed__ = true
</script>
<script type="module" src="http://localhost:3001/@vite/client"></script>
```

- Script for the `<body>` tag and make sure to 

> [!IMPORTANT]  
> Platform is required to load buyer portal properly, select one depending on [your store channel platform](https://developer.bigcommerce.com/docs/rest-management/channels#platform)

> [!WARNING]
> Replace the `REPLACE_WITH_YOUR_STORE_HASH` and `REPLACE_WITH_YOUR_CHANNEL_ID` with the appropriate information

```html
<script type="module" src="http://localhost:3001/src/main.ts"></script>
<script>
  window.B3 = {
    setting: {
      store_hash: 'REPLACE_WITH_YOUR_STORE_HASH',
      channel_id: REPLACE_WITH_YOUR_CHANNEL_ID,
    },
  }
</script>
```

5. Enable `Custom (use for your self-hosted buyer portal)`

  - In B2B Edition App dashboard -> Settings -> Buyer Portal for global config ![Buyer portal type global settings](../public/images/buyer-portal-type-settings-global.png)
  - Or B2B Edition App dashboard -> Storefront -> Desired channel -> Buyer Portal for specific channel config ![Buyer portal type channel settings](../public/images/buyer-portal-type-settings-channel.png)

6. Visit the headless storefront and attempt to sign in.

**FAQs:**
- linters are not working: run `yarn prepare` first.
- `cross-origin` issues: update URL variables in .env to make sure api calls are using your tunnel URL with HTTPS.

## Deploying the project

Building your buyer portal application requires you to run the `yarn build` command. This command will generate a `dist` folder in the `apps/storefront` directory and inside an `assets` folder containing the compiled assets.

Make sure that you have configured the following `.env` values correctly before building:

- `VITE_IS_LOCAL_ENVIRONMENT`: Set this to `FALSE`
- `VITE_ASSETS_ABSOLUTE_PATH`: Set this to the URL where the assets folder is hosted. **Note that this needs to be the absolute URL to the `/assets` folder location where the build will be served from in production.** Also please include the trailing `/`.

  For example, if you deploy the contents of the `dist` folder built by running `yarn build` and hosted it at https://my.custom.cdn/generated/b2b, the value you should put is https://my.custom.cdn/generated/b2b/assets/.

Environment variables have been updated so you can run your UI directly into production storefronts.

### Pasting the auto-loader scripts

Once you have uploaded the contents of the `dist` folder to your hosting provider, you will need to include a reference to the scripts in your headless site as well. It should look something like this:

```html
<script>
  window.b3CheckoutConfig = {
    routes: {
      dashboard: '/account.php?action=order_status',
    },
  }
  window.B3 = {
    setting: {
      store_hash: 'REPLACE_WITH_YOUR_STORE_HASH',  
      channel_id: REPLACE_WITH_YOUR_CHANNEL_ID,
    },
    'dom.checkoutRegisterParentElement': '#checkout-app',
    'dom.registerElement':
      '[href^="/login.php"], #checkout-customer-login, [href="/login.php"] .navUser-item-loginLabel, #checkout-customer-returning .form-legend-container [href="#"]',
    'dom.openB3Checkout': 'checkout-customer-continue',
    before_login_goto_page: '/account.php?action=order_status',
    checkout_super_clear_session: 'true',
    'dom.navUserLoginElement': '.navUser-item.navUser-item--account',
  }
</script>
<script
  type="module"
  crossorigin=""
  src="<YOUR_APP_URL_HERE>/index.*.js"
></script>
<script
  nomodule=""
  crossorigin=""
  src="<YOUR_APP_URL_HERE>/polyfills-legacy.*.js"
></script>
<script
  nomodule=""
  crossorigin=""
  src="<YOUR_APP_URL_HERE>/index-legacy.*.js"
></script>
```

> [!IMPORTANT]
> Replace the following values:
> - `<VITE_ASSETS_ABSOLUTE_PATH>` with the value you used for the environment variable `VITE_ASSETS_ABSOLUTE_PATH` (where your build is hosted)
> - `REPLACE_WITH_YOUR_STORE_HASH` with your store hash
> - `REPLACE_WITH_YOUR_CHANNEL_ID` with the headless channel id


## Deploying the project in Catalyst

To integrate the custom Buyer Portal script into your Catalyst storefront, follow these steps:

1. Navigate to the Script File: Open the file located at script-production.tsx within your Catalyst project. You can find this file in the directory structure at https://github.com/bigcommerce/catalyst/blob/integrations/b2b-buyer-portal/core/b2b/script-production.tsx.

2. Clear Existing JSX: Delete all the JSX code returned within the script-production.tsx component file.

3. Paste the script and modify for JSX and Next.js `<Script/>` tag: You'll need to make adjustments to ensure the [auto-loader scripts](#pasting-the-script) have valid JSX and utilizes Next.js's Script component. This typically involves the following:

    - Wrapping in `<Script />`: Enclose the entire pasted script within the Script component from Next.js.

    - Injecting script values as strings: Identify the necessary dynamic values such as channel_id, store_hash, and any other relevant configuration, they are accessible from the app environment variables. For example:

    ```javascript
    <Script>
    {"""
      window.b3CheckoutConfig = {
        routes: {
          dashboard: '/account',
        },
      }
      // ...rest
    """}
    </Script>
    ```