/**
 * Shared BC Storefront GraphQL type projections.
 *
 * These match the fields selected in SF GQL queries. No codegen exists
 * for the SF GQL schema; replace with generated types when available.
 */

export interface Money {
  currencyCode: string;
  value: number;
}

export interface PageInfo {
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  startCursor: string | null;
  endCursor: string | null;
}

export interface CollectionInfo {
  totalItems: number | null;
}

export interface DateTimeExtended {
  utc: string;
}
