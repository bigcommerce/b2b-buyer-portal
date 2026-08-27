import { storefrontGQLRequest } from './client';

/**
 * `site.products` is capped server-side at 50 products per page, so product ids are requested in
 * batches of this size.
 */
const PRODUCTS_PER_REQUEST = 50;

/**
 * Options and option values are requested with an explicit page size, as the connections default to
 * a smaller server-side limit.
 */
const OPTIONS_PER_PRODUCT = 50;

interface LocalizedProductOptionNode {
  entityId: number;
  displayName: string;
  // `values` only exists on MultipleChoiceOption; field type options (text, date, file, ...) have no
  // values to localize.
  values?: {
    edges: Array<{ node: { entityId: number; label: string } }> | null;
  } | null;
}

interface LocalizedProductsResponse {
  data: {
    site: {
      products: {
        edges: Array<{
          node: {
            entityId: number;
            name: string;
            path: string;
            productOptions: {
              edges: Array<{ node: LocalizedProductOptionNode }> | null;
            };
          };
        }> | null;
      };
    };
  };
}

export interface LocalizedProductOption {
  entityId: number;
  displayName: string;
  values: Array<{ entityId: number; label: string }>;
}

export interface LocalizedProduct {
  entityId: number;
  name: string;
  path: string;
  options: LocalizedProductOption[];
}

const getLocalizedProductsQuery = `
query LocalizedProducts($entityIds: [Int!]!, $first: Int!, $optionsFirst: Int!) {
  site {
    products(entityIds: $entityIds, first: $first) {
      edges {
        node {
          entityId
          name
          path
          productOptions(first: $optionsFirst) {
            edges {
              node {
                entityId
                displayName
                ... on MultipleChoiceOption {
                  values(first: $optionsFirst) {
                    edges {
                      node {
                        entityId
                        label
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
}`;

const toLocalizedProducts = (response: LocalizedProductsResponse): LocalizedProduct[] =>
  (response?.data?.site?.products?.edges ?? []).map(({ node }) => ({
    entityId: node.entityId,
    name: node.name,
    path: node.path,
    options: (node.productOptions?.edges ?? []).map(({ node: option }) => ({
      entityId: option.entityId,
      displayName: option.displayName,
      values: (option.values?.edges ?? []).map(({ node: value }) => value),
    })),
  }));

const chunk = <T>(items: T[], size: number): T[][] => {
  const chunks: T[][] = [];

  for (let index = 0; index < items.length; index += size) {
    chunks.push(items.slice(index, index + size));
  }

  return chunks;
};

/**
 * Fetches product names, URL paths and option labels from the storefront GraphQL API, which resolves
 * catalog translations for the shopper's active locale. B2B GraphQL returns this text in the store's
 * default language only.
 */
export const getLocalizedProducts = async (productIds: number[]): Promise<LocalizedProduct[]> => {
  const uniqueIds = Array.from(new Set(productIds));

  if (uniqueIds.length === 0) {
    return [];
  }

  const responses = await Promise.all(
    chunk(uniqueIds, PRODUCTS_PER_REQUEST).map((entityIds) =>
      storefrontGQLRequest<LocalizedProductsResponse>({
        query: getLocalizedProductsQuery,
        variables: {
          entityIds,
          first: entityIds.length,
          optionsFirst: OPTIONS_PER_PRODUCT,
        },
      }),
    ),
  );

  return responses.flatMap(toLocalizedProducts);
};
