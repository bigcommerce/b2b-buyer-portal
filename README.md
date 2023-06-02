# B3-FE-Turbo

The bundleB2B frontend monorepo with [Turborep](https://turborepo.org/), TypeScript and React are the core technologies.

This turborepo uses [Yarn](https://classic.yarnpkg.com/lang/en/) as a package manager. It includes the following packages/apps:

## Apps and Packages

- `/apps/storefront`: the new BundleB2B storefront aplication, [React 18](https://reactjs.org/) app using [vite](http://vitejs.dev/) as the building tool.

- `/packages/eslint-config-b3`: the shared eslint config.

- `/packages/tsconfig`: the shared tsconfig.

- `/packages/ui`: to put all the UI which created by B3.

## What's inside?

This turborepo has the tools and packages already setup:

- [TypeScript](https://www.typescriptlang.org/) for static type checking.
- [ESLint](https://eslint.org/) for code linting.
- [commitlint]([https://commitlint.js.org/#/) for the git commit message linting.
- ([Husky - Git hooks](https://typicode.github.io/husky/#/)) and [lint-staged](https://github.com/okonet/lint-staged) for git hooks.
- [MUI 5](https://mui.com/) as the basic UI library.
- [React Router 6](https://reactrouter.com/) as the frontend router.

## Setup

1. Run `yarn install`
2. Copy `apps/storefront/.env-example` and paste it as `.env`
3. Update the `VITE_STORE_HASH` value on `.env` file
4. Update the `VITE_CATPCHA_SETKEY` value on `.env` file
5. Update the `VITE_B2B_CLIENT_ID`value on `.env`file
6. Run `yarn dev`

## How to run project locally

1. Activate store channel in the Channels Manager

2. To have the login feature of the b3-fe-turbo project working we need to add a header and footer scripts to our store using the script manager.

   - Go to the Channels Manager -> Scripts

   - We need to add two scripts to inject our code to storefront, select the names you prefer, e.g. Bundleb2b-header, Bundleb2b-footer

   - Before saving, validate the correct values of the port used for running localhost and modify the urls in the scripts.

   - Header script:

   ```
   <script>
       {{#if customer.id}}
       {{#contains page_type "account"}}
       var b2bHideBodyStyle = document.createElement('style');
       b2bHideBodyStyle.id = 'b2b-account-page-hide-body';
       b2bHideBodyStyle.innerHTML = 'body { display: none !important }';
       document.head.appendChild(b2bHideBodyStyle);
       {{/contains}}
       {{/if}}
   </script>
   <script type="module">
       import RefreshRuntime from "http://localhost:3001/@react-refresh"
       RefreshRuntime.injectIntoGlobalHook(window)
       window.$RefreshReg$ = () => {}
       window.$RefreshSig$ = () => (type) => type
       window.__vite_plugin_react_preamble_installed__ = true
   </script>
   <script type="module" src="http://localhost:3001/@vite/client"></script>
   <script type="module" src="http://localhost:3001/index.html?html-proxy&index=0.js"></script>
   ```

   - Footer script:

   ```
   <script type="module" src="http://localhost:3001/src/main.ts"></script>
   ```

3. Make sure you have added the correct values to the env file in the project. Is important to add the client_id of the draft app since it is used in the codebase while retrieving the jwt token. Otherwise there will appear some error messages related to invalid signatures.

4. In the file `.env` set up the `VITE_LOCAL_DEBUG` to false.

5. Go to the storefront and try to sign in.

6. If any issue related cross origin change the value of the variables related to urls in the env file with the one set up as the tunnel url using https.

> Note: please run `yarn prepare` first if the linters are not working.
