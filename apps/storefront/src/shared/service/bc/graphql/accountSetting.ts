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
      fieldEntityId: number | null;
      name: string;
      multilineText: string;
    }
  | {
      __typename: 'MultipleChoiceExtraFieldValue';
      fieldEntityId: number | null;
      name: string;
      value: string;
    }
  | {
      __typename: 'NumberExtraFieldValue';
      fieldEntityId: number | null;
      name: string;
      number: number;
    }
  | { __typename: 'TextExtraFieldValue'; fieldEntityId: number | null; name: string; text: string };

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

export interface B2BUser {
  company: string;
  companyRoleName: string;
  email: string;
  extraFields: AccountSettingExtraFieldValue[];
  firstName: string;
  formFields: FormFieldValue[];
  lastName: string;
  phoneNumber: string;
}

export interface GetB2BUserAccountSettingsResponse {
  data?: {
    company?: {
      companyUser?: B2BUser;
    };
  };
  errors?: Array<{ message: string }>;
}

export interface B2CUser {
  firstName: string;
  lastName: string;
  company: string;
  phoneNumber: string;
  email: string;
  formFields: FormFieldValue[];
}

export interface GetB2CUserAccountSettingsResponse {
  data?: {
    customer?: B2CUser;
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

const GET_B2B_USER_ACCOUNT_SETTINGS = `query GetB2BUserAccountSettings {
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

const GET_B2C_USER_ACCOUNT_SETTINGS = `query GetB2CUserAccountSettings {
  customer {
    firstName
    lastName
    company
    phoneNumber: phone
    email
    formFields {
      ${formFieldsFragment}
    }
  }
}`;

// ===========================================================================
// Service function
// ===========================================================================

export async function getCompanyUserAccountInfo(): Promise<GetB2BUserAccountSettingsResponse> {
  return storefrontGQLRequest<GetB2BUserAccountSettingsResponse>({
    query: GET_B2B_USER_ACCOUNT_SETTINGS,
  });
}

export async function getCustomerAccountInfo(): Promise<GetB2CUserAccountSettingsResponse> {
  return storefrontGQLRequest<GetB2CUserAccountSettingsResponse>({
    query: GET_B2C_USER_ACCOUNT_SETTINGS,
  });
}
