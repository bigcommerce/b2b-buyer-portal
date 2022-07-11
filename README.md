# B3-FE-Turbo

The bundleB2B frontend monorepo with [Turborep](https://turborepo.org/), TypeScript and React are the core technologies.

This turborepo uses [Yarn](https://classic.yarnpkg.com/lang/en/) as a package manager. It includes the following packages/apps:

## Apps and Packages

- `/apps/storefront`: the new BundleB2B storefront aplication,  [React 18](https://reactjs.org/) app using [vite](http://vitejs.dev/) as the building tool.

- `/packages/eslint-config-b3`: the shared eslint config.

- `/packages/tsconfig`: sthe shared tsconfig.

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

This repository is used in the `npx create-turbo` command and `yarn` as a package manager.

> Note: please run `yarn prepare` first if the linters are not working.

### Build

To build all apps and packages, run the following command:

```shell
yarn build
```

### Develop

```shell
yarn dev
```

### Lint

```shell
yarn lint
```
