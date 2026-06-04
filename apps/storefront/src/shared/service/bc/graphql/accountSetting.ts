/**
 * Unified SF GQL Account Settings API (B2B + BC).
 *
 * Replaces b2b/graphql/accountSetting.ts. The new query covers all fields
 * for both B2B and B2C users in a single call with typed union fields.
 */

import { storefrontGQLRequest } from './client';

// ===========================================================================
// Account-settings SF GQL type projections
// ===========================================================================

export type AccountSettingExtraFieldValue =
  | {
      __typename: 'MultilineTextExtraFieldValue';
      fieldEntityId: number;
      name: string;
      multilineText: string;
    }
  | {
      __typename: 'MultipleChoiceExtraFieldValue';
      fieldEntityId: number;
      name: string;
      value: string;
    }
  | { __typename: 'NumberExtraFieldValue'; fieldEntityId: number; name: string; number: number }
  | { __typename: 'TextExtraFieldValue'; fieldEntityId: number; name: string; text: string };

export type FormFieldValue =
  | {
      __typename: 'CheckboxesFormFieldValue';
      entityId: number;
      name: string;
      valueEntityIds: number[];
      values: string[];
    }
  | {
      __typename: 'DateFormFieldValue';
      entityId: number;
      name: string;
      date: { utc: string };
    }
  | {
      __typename: 'MultilineTextFormFieldValue';
      entityId: number;
      name: string;
      multilineText: string;
    }
  | {
      __typename: 'MultipleChoiceFormFieldValue';
      entityId: number;
      name: string;
      value: string;
      valueEntityId: number;
    }
  | { __typename: 'NumberFormFieldValue'; entityId: number; name: string; number: number }
  | { __typename: 'PasswordFormFieldValue'; entityId: number; name: string; password: string }
  | { __typename: 'TextFormFieldValue'; entityId: number; name: string; text: string };

export interface CompanyUser {
  company: string;
  companyRoleName: string;
  email: string;
  extraFields: AccountSettingExtraFieldValue[];
  firstName: string;
  formFields: FormFieldValue[];
  lastName: string;
  phoneNumber: string;
}

export interface GetCompanyUserAccountSettingsResponse {
  data?: {
    company?: {
      companyUser?: CompanyUser;
    };
  };
  errors?: Array<{ message: string }>;
}

// ===========================================================================
// Fragments
// ===========================================================================

const extraFieldsFragment = `
    fieldEntityId
    name
    ... on MultilineTextExtraFieldValue { __typename fieldEntityId multilineText name }
    ... on MultipleChoiceExtraFieldValue { __typename fieldEntityId name value }
    ... on NumberExtraFieldValue { __typename fieldEntityId name number }
    ... on TextExtraFieldValue { __typename fieldEntityId name text }`;

const formFieldsFragment = `
    entityId
    name
    ... on CheckboxesFormFieldValue { __typename entityId name valueEntityIds values }
    ... on DateFormFieldValue { __typename date { utc } entityId name }
    ... on MultilineTextFormFieldValue { __typename entityId multilineText name }
    ... on MultipleChoiceFormFieldValue { __typename entityId name value valueEntityId }
    ... on NumberFormFieldValue { __typename entityId name number }
    ... on PasswordFormFieldValue { __typename entityId name password }
    ... on TextFormFieldValue { __typename entityId name text }`;

// ===========================================================================
// Query
// ===========================================================================

const GET_COMPANY_USER_ACCOUNT_SETTINGS = `query GetCompanyUserAccountSettings {
  company {
    companyUser {
      company
      companyRoleName
      email
      firstName
      lastName
      phoneNumber
      extraFields {
        ${extraFieldsFragment}
      }
      formFields {
        ${formFieldsFragment}
      }
    }
  }
}`;

// ===========================================================================
// Service function
// ===========================================================================

export async function getCompanyUserAccountSettings(): Promise<GetCompanyUserAccountSettingsResponse> {
  return storefrontGQLRequest<GetCompanyUserAccountSettingsResponse>({
    query: GET_COMPANY_USER_ACCOUNT_SETTINGS,
  });
}
