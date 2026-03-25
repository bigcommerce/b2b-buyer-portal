import { platform } from '@/utils/basicConfig';

import B3Request from '../../request/b3Fetch';

/**
 * GraphQL Storefront API: Company Account Registration
 * https://developer.bigcommerce.com/docs/storefront/graphql/b2b/account-registration
 */

/** Generic extra-fields shape for company, address, and company user (texts, multilineTexts, multipleChoices, numbers). */
export interface ExtraFields {
  texts?: Array<{ name: string; text: string }>;
  multilineTexts?: Array<{ name: string; multilineText: string }>;
  multipleChoices?: Array<{ name: string; fieldValue: string }>;
  numbers?: Array<{ name: string; number: string | number }>;
}

export interface RegisterCompanyAddressInput {
  firstName: string;
  lastName: string;
  address1: string;
  address2?: string;
  city: string;
  countryCode: string;
  stateOrProvince?: string;
  phone?: string;
  postalCode?: string;
  extraFields?: ExtraFields;
}

export interface RegisterCompanyInput {
  name: string;
  email: string;
  phone: string;
  address: RegisterCompanyAddressInput;
  fileList?: Array<{ fileId: string }>;
  extraFields?: ExtraFields;
  companyUser?: { extraFields?: ExtraFields };
}

interface RegisterCompanyValidationError {
  __typename?: string;
  message: string;
  path?: string[];
}

/**
 * String status returned by the Storefront GraphQL `registerCompany` mutation.
 * Maps to the same lifecycle as numeric `CompanyStatus` in `@/types/company`
 * (PENDING=0, APPROVED=1, REJECTED=2, INACTIVE=3, DELETED=4).
 */
export enum RegisterCompanyStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
  INACTIVE = 'INACTIVE',
  DELETED = 'DELETED',
}

interface RegisterCompanyResult {
  entityId: number | null;
  status: RegisterCompanyStatus;
  errors: RegisterCompanyValidationError[];
}

/** Raw Storefront GraphQL response for `registerCompany`; callers interpret top-level `errors` and payload `errors`. */
export interface RegisterCompanyMutationResponse {
  data?: {
    company?: {
      registerCompany?: RegisterCompanyResult;
    };
  };
  errors?: Array<{ message: string }>;
}

const REGISTER_COMPANY_MUTATION = `mutation RegisterCompany($input: RegisterCompanyInput!) {
  company {
    registerCompany(input: $input) {
      entityId
      status
      errors {
        ... on ValidationError {
          message
          path
        }
      }
    }
  }
}`;

/**
 * Register a company account via the GraphQL Storefront API (raw response; no error normalization).
 * Requires an authenticated storefront session (e.g. customer just created).
 * Uses the store's GraphQL endpoint (BC or proxy depending on platform).
 * @see https://developer.bigcommerce.com/docs/storefront/graphql/b2b/account-registration
 */
export async function registerCompany(
  input: RegisterCompanyInput,
): Promise<RegisterCompanyMutationResponse> {
  const variables = { input };
  return platform === 'bigcommerce'
    ? B3Request.graphqlBC<RegisterCompanyMutationResponse>({
        query: REGISTER_COMPANY_MUTATION,
        variables,
      })
    : B3Request.graphqlBCProxy<RegisterCompanyMutationResponse>({
        query: REGISTER_COMPANY_MUTATION,
        variables,
      });
}
