# Contribution Guide

## Table of contents

- [Project overview](#project-overview)
  - [Structure](#structure)
  - [State management](#state-management)
    - [Reducers](#reducers)
    - [Selectors](#selectors)
- [Submit changes](#submit-changes)
  - [Coding guideline](#coding-guideline)
  - [Commit guideline](#commit-guideline)
  - [Styling](#styling)
  - [Pull Requests](#pull-requests)
  - [Developer commands](#developer-commands)
  - [System requirement](#system-requirement)
- [Submit issues](#submit-issues)
- [Release version](#release-version)

## Project overview

### Structure

The entry point of the library is `apps/storefronts/src`, where you can find the components, pages and all functions that hold the logic of the different features of the buyer portal.

The logic of the buyer portal features is grouped under `pages` directory, i.e.: `dashboard`, `quote`, `login`, etc. And located under each specific page folder there are components and other resources used only in those pages. All the UI components used in those pages are located under the `components` directory. Any logic shared across different components would be located in the `utils` folder.

### Life cycle of the buyer portal

The buyer portal starts itself when it is injected in the stencil store or headless store. It will first retrieve all the basic store, company, tax zone rates and currency information via the graphql api. If the hash route matches, or the url is a specific stencil url, it will also initialize the buyer portal UI.

The communication happens through the b2b api backend and it uses the b2bToken for authorization. We use a bcGraphqlToken to communicate too to the BigCommerce api only for features such as `login`, `currencies` or some `cart` actions.

### State management

We keep the state of the buyer portal persisted using a redux store for the communication between the store and the buyer portal. Right now there are variables stored in a context variable and local storage. We are in the process of moving all state to be allocated only in the redux store so we encourage everyone to use the redux to save the state of the application.

#### Reducers

We have separate reducers for different parts of the application we want to load or modify. The root reducer is formed by combining multiple smaller reducers, i.e.: `company`, `quoteInfo` etc. This approach allows us to break down the large state tree into more manageable chunks.

We suggest avoiding the use of large reducers to improve the readability of the code and to make the state of the application more manageable.

#### Selectors

You can access the state of the data store synchronously via selectors. Selectors are objects responsible for retrieving or deriving data from multiple sources. They act as access points to the underlying state tree. They only return new objects if the return values are different to the previous values. This is so that UI can determine whether to re-render by doing a simple equality check against the new values. Their returned values are immutable. In fact, they are frozen in development mode unless specified otherwise. We want to discourage external consumers from directly mutating the internal state of the library, which can lead to unexpected behaviours.

When actions are dispatched, they get processed by reducers and eventually reach the data store to be retained. Reducers are responsible for controlling what and where the information should be retained. When there is a change in the state, all subscribers get notified and receive the latest state.

## Submit changes

To submit changes as a [pull request](https://help.github.com/articles/creating-a-pull-request-from-a-fork/), first you have to fork the repository. Then you have to create a branch and commit your changes to it. Finally, you can submit a pull request from that branch against the master branch of the canonical repository. The master branch should always be stable, meaning it should be in a functional state. If there is a feature that requires multiple PRs to complete and might put the master branch in an unstable state, you should commit to a feature branch instead.

Your code should follow our [coding guideline](#coding-guideline). Your commit messages also need to follow our [guideline](#commit-guideline). All changes must have some unit test coverage and should never lower the overall coverage of the project. Before they can be merged to the master branch, they must be reviewed and approved by one of the project maintainers. You can ask people to review your PR by requesting individual members or pinging the entire team using `@buyer-portal` handle.

Create selectors with the custom `useAppSelector` hook directly in your components. If you want to compute a new value out of your selector function, please consider creating a new selector in the `apps/storefront/src/store/selectors.ts` file, for example:

```js
export const isLoggedInSelector = createSelector(
  companySelector,
  (company) => company.customer.role !== CustomerRole.GUEST,
)
```

When consuming the data in any component

```js
const isLoggedIn = useAppSelector(isLoggedInSelector)
```

### Coding guideline

We have enabled a set of [linting rules](https://github.com/bigcommerce/eslint-config) to help us maintain the stylistic consistency of our code. Visit [TSLint](https://palantir.github.io/tslint/rules/) for more information about the enabled rules. It is important to enforce these rules automatically because contributions from different people might vary in style. Nonetheless, there might be a few issues that cannot be caught programmatically because there are no existing rules. Usually these errors will be caught during the code review process. We usually use :tropical_drink: or :beer: in those comments, to indicate that they are stylistic issues only.

### Coding style guide

1.- Naming conventions

- PascalCase for file names and React component names
- For React components’ file names should be the same as the component
- Pay attention to any typo in the submitted code
- Always use double quotes for JSX attributes, but single quotes for all JS.

  2.- Comments should be only used to describe the intention of the code or functionality to other developers.

### Pull Requests

3.- When submitting a PR please tag Marco Loyo (bc-marco), Victor Campos (bc-victor) or Estefania Ocampo (deov31) for approval. It’s going to require at least one approval from any of them.

4.- Avoid adding new variables to any data object stored in a context or the localstorage. Everything should be stored in redux.

5.- Avoid adding more code that ignore these next rules:

- "react/jsx-props-no-spreading": 0
- "@typescript-eslint/no-shadow": 0
- "@typescript-eslint/no-explicit-any": 0
- "no-console": 0
- "@typescript-eslint/ban-types": 0
- "@typescript-eslint/no-namespace": 0
- "react/destructuring-assignment": 0
- "@typescript-eslint/no-non-null-assertion": 0

  6.- Follow with the next folder structure, quite similar to the current one.

```
src/
	constants/
	hooks/
	pages/
	    AccountSettings/
		.
		.
		.
	    OrderDetail/
	         components/
		  shared/
		  types/
		  tests/
		  styles.ts
	shared/
		components/
		types/
	store/
	utils/

b2b-types/
    quotes/
    shopping-list/
```

### Commit guideline

You should keep your commit messages clear and concise. More importantly, the commits themselves should have a clear focus. Otherwise, it can be difficult for us to examine the commit history if we ever need to investigate for the source of a bug.

We follow a specific format when writing commit messages.

```
fix: JIRA-1234 Fix product not loading in quote table
```

Since community contributors do not have access to JIRA, they can use a Github issue number instead. For more information about the format, visit [@bigcommerce/validate-commits](https://github.com/bigcommerce/validate-commits). We recommend you to double check your commit messages before submitting your PR, making sure they do not have any mistakes.

### Developer commands

We have a list of commands that contributors can use while developing.

- `yarn run lint` - Lint the source code.
- `yarn run dev` - Run in dev mode the buyer portal

### System requirement

Please ensure you have the following software installed.

- NodeJS `>=18`
- Yarn `>=1.22.0`

## Submit issues

Create a Github issue if you find a bug in the source code or if you want to request a new feature. The maintainers of the project will review and triage the issue accordingly. If we decide to take on a task, we will raise a corresponding JIRA ticket to help us track the issue internally.

Please do not raise a Github issue if you just need general support or advice on how to use the library.

## Release version

Everytime a PR is merged to the master branch, CircleCI will trigger a build automatically. However, it won't create a new Git release until it is approved by a person with write access to the repository.
