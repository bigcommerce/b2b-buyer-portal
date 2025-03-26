<img src="https://storage.googleapis.com/bigcommerce-developers/images/B2B-edition-1024x683.jpg" alt="B2B Edition Open Source Buyer Portal" title="B2B Edition Open Source Buyer Portal">

<br />
<br />

<div align="center">

[![MIT License](https://img.shields.io/github/license/bigcommerce/catalyst)](LICENSE.md)
[![Lighthouse Report](https://github.com/bigcommerce/catalyst/actions/workflows/lighthouse.yml/badge.svg)](https://github.com/bigcommerce/catalyst/actions/workflows/lighthouse.yml) [![Lint, Typecheck, gql.tada](https://github.com/bigcommerce/catalyst/actions/workflows/basic.yml/badge.svg)](https://github.com/bigcommerce/catalyst/actions/workflows/basic.yml)

</div>

**B2B Buyer Portal** is a monorepo frontend application designed for the BigCommerce B2B Edition Buyer portal. The B2B Buyer Portal is built using [Turborepo](https://turbo.build/), [TypeScript](https://www.typescriptlang.org/), and [React](https://react.dev/).

By choosing to build on top of our Open Source B2B Buyer Portal, you'll have access to build on our B2B buyer portal application backed by a robust set of SaaS APIs.
You can get straight to work building for your unique B2B business cases.

![-----------------------------------------------------](https://storage.googleapis.com/bigcommerce-developers/images/catalyst_readme_hr.png)

<p align="center">
 <a href="https://www.bigcommerce.com/solutions/b2b-ecommerce-platform/">🚀 B2B Edition</a> •
 <a href="https://developer.bigcommerce.com/community">🤗 BigCommerce Developer Community</a> •
 <a href="https://bundleb2b.stoplight.io/docs/openapi/quick-start">📝 B2B Edition API Reference</a> •
</p>

![-----------------------------------------------------](https://storage.googleapis.com/bigcommerce-developers/images/catalyst_readme_hr.png)

## Index

- [Index](#index)
- [☑ Prerequisites](#-prerequisites)
  - [Step 1: Access the Storefronts Manager](#step-1-access-the-storefronts-manager)
  - [Step 2: Enable B2B on Your Channel](#step-2-enable-b2b-on-your-channel)
  - [Step 3: Contact Us for Additional Support](#step-3-contact-us-for-additional-support)
- [🚀 Core Technologies](#-core-technologies)
- [📦 Workspaces](#-workspaces)
- [🛠 Tools and Libraries](#-tools-and-libraries)
- [🛠 System Setup](#-system-setup)
- [⚙ Local Development](#-local-development)
- [Running Project Locally](#running-project-locally)
- [Deploying the project](#deploying-the-project)
  - [Common issues:](#common-issues)
- [🤝 Contribution](#-contribution)
- [📞 Contact \& Support](#-contact--support)
- [License](#license)

## ☑ Prerequisites

### Step 1: Ensure you have access to the B2B edition app

If you do not have access to the B2B edition app please reach out to your account or partner manager

### Step 2 (optional): Access storefront manager (Only for B2B Multi-storefront and headless stores)

After installing the B2B Edition App, go to the app's dashboard and select the 'Storefronts' section.

<img width="200" alt="b2bNav" src="public/images/b2bNav.png">
  
### Step 3: Enable B2B on Your Channel

Choose the channel where you wish to enable B2B functionality. Initially, B2B features can be activated on a single channel only.

<img width="480" alt="storefront-settings-b2b" src="public/images/storefront-settings.png">

### Step 4: Contact Us for Additional Support

For assistance with activating the remote buyer portal or to inquire about multi-storefront support, which allows you to utilize B2B features across multiple channels, please reach out to support, or raise an issue right here in this repository.

## 🚀 Core Technologies

- **Monorepo Management:** Turborepo
- **Type System:** TypeScript
- **Frontend Library:** React 18
- **Build Tool:** Vite

## 📦 Workspaces

- **Application:** `/apps/storefront` - A next-gen B2B Edition storefront application.
  - You can run multiple apps concurrently via turborepo [tasks](https://turbo.build/repo/docs/core-concepts/monorepos/running-tasks).
- **Packages:**
  - `/packages/eslint-config-b3` - Shared ESLint configurations.
  - `/packages/tsconfig` - Shared TypeScript configurations.
  - `/packages/ui` - A collection of UI components built by B3.
  - `/packages/store` - A collection of shared store logic.
  - `/packages/b3global` - A collection of shared global logic.

## 🛠 Tools and Libraries

- **Linting:** ESLint
- **UI Framework:** MUI 5
- **Routing:** React Router 6

## 🛠 System Setup

- **Node:** Ensure you have Node.js version >=18.0.0.
- **Package Manager:** This project uses Yarn v1.22.17.

## ⚙ Getting Started

1. Installation of Node and Yarn.
   - For Node, we recommend using [nvm](https://github.com/nvm-sh/nvm).
   - Once Node is installed, you can install Yarn by using `npm i -g yarn`.
2. Clone the repository.
3. Install dependencies using `yarn`.
4. Copy environment variables: `cp apps/storefront/.env-example apps/storefront/.env`.
5. Update the values in `.env` with your specific values
6. Start the development server: `yarn dev`.
7. **Access to the store through the url i.e: https://my-store.mybigcommerce.com/ or https://my-store.com/ not http://localhost:3001**

### [Developing on Stencil](./docs/stencil.md)

Read the [Stencil Guide](./docs/stencil.md) when you are working on the BigCommerce Stencil storefront platform

### [Developing for Headless](./docs/headless.md)

Read the [Headless Guide](./docs/headless.md) when you are working on Catalyst, NextJS and other headless storefronts

### Common issues:

- **Stencil CLI** We're working to bring full support to integrate buyer portal into [stencil-cli](https://developer.bigcommerce.com/docs/storefront/stencil). If you find any issues feel free to open an issue report.
- **Cross-Origin Issues:** If you encounter cross-origin issues, ensure you have the correct URLs in your `.env` file and verify that your store's origin URL is allowed. You can use a tunnel service like [ngrok](https://ngrok.com/) to expose your local server to the internet.
- **Environment Variables:** Ensure you have the correct environment variables set in your `.env` file. These variables are used to configure your application for different environments.
- **Header and Footer Scripts:** Ensure you have the correct header and footer scripts set in your BigCommerce store. These scripts are used to load your application into the storefront.
- **Build Errors:** If you encounter build errors, ensure you have the correct dependencies installed and that your project is set up correctly. You can run `yarn prepare` to ensure all dependencies are installed and up to date.

## 🤝 Contribution

For developers wishing to contribute, ensure all PRs meet the linting and commit message standards.

## 📞 Contact & Support

For queries, issues, or support please open an issue in this repository.

## License

MIT
