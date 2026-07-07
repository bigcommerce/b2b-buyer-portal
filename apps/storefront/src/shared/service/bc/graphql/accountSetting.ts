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

export interface CompanyUserResponse {
  data?: {
    company?: {
      companyUser?: CompanyUser;
    };
  };
  errors?: Array<{ message: string }>;
}

export interface Customer {
  firstName: string;
  lastName: string;
  company: string;
  phoneNumber: string;
  email: string;
  formFields: FormFieldValue[];
}

export interface CustomerResponse {
  data?: {
    customer?: Customer;
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

const QUERY_COMPANY_USER_DETAILS = `query CompanyUserDetails {
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

const QUERY_CUSTOMER_DETAILS = `query CustomerDetails {
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

export async function getCompanyUserDetails(): Promise<CompanyUserResponse> {
  return storefrontGQLRequest<CompanyUserResponse>({
    query: QUERY_COMPANY_USER_DETAILS,
  });
}

export async function getCustomerDetails(): Promise<CustomerResponse> {
  return storefrontGQLRequest<CustomerResponse>({
    query: QUERY_CUSTOMER_DETAILS,
  });
}

// ===========================================================================
// Customer form-field definitions (site.settings.formFields.customer)
// ===========================================================================

// The definitions list every customer form field with its entityId — including
// fields the customer has no value for yet (which customer.formFields omits). This
// is the authoritative source of fieldEntityId for the customer.updateCustomer input.
// Choice fields also expose their options, so a selected label maps to its own entityId.
export interface CustomerFormFieldOption {
  entityId: number;
  label: string;
}

export interface CustomerFormFieldDefinition {
  __typename: string;
  entityId: number;
  label: string;
  options?: CustomerFormFieldOption[];
}

export interface CustomerFormFieldSettingsResponse {
  data?: {
    site?: {
      settings?: {
        formFields?: {
          customer?: CustomerFormFieldDefinition[];
        };
      };
    };
  };
  errors?: Array<{ message: string }>;
}

const QUERY_CUSTOMER_FORM_FIELD_SETTINGS = `query CustomerFormFieldSettings {
  site {
    settings {
      formFields {
        customer {
          __typename
          entityId
          label
          ... on MultipleChoicesFormField { options { entityId label } }
          ... on CheckboxesFormField { options { entityId label } }
        }
      }
    }
  }
}`;

export async function getCustomerFormFieldDefinitions(): Promise<CustomerFormFieldSettingsResponse> {
  return storefrontGQLRequest<CustomerFormFieldSettingsResponse>({
    query: QUERY_CUSTOMER_FORM_FIELD_SETTINGS,
  });
}

// ===========================================================================
// Update mutation (BC-native customer.updateCustomer)
// ===========================================================================

// Typed form-field groups mirror the BC Storefront CustomerFormFieldsInput; each
// entry is keyed by the field's numeric fieldEntityId (resolved from the definitions).
export interface CustomerFormFieldsInput {
  checkboxes?: Array<{ fieldEntityId: number; fieldValueEntityIds: number[] }>;
  multipleChoices?: Array<{ fieldEntityId: number; fieldValueEntityId: number }>;
  numbers?: Array<{ fieldEntityId: number; number: number }>;
  dates?: Array<{ fieldEntityId: number; date: string }>;
  passwords?: Array<{ fieldEntityId: number; password: string }>;
  multilineTexts?: Array<{ fieldEntityId: number; multilineText: string }>;
  texts?: Array<{ fieldEntityId: number; text: string }>;
}

export interface UpdateCustomerInput {
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  email?: string;
  formFields?: CustomerFormFieldsInput;
}

export interface UpdateCustomerResponse {
  data?: {
    customer?: {
      updateCustomer?: {
        customer?: Customer;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

// customer.updateCustomer needs a reCaptchaV2 token when reCaptcha is enabled on the
// storefront, so the token argument is only added when one is supplied.
const updateCustomerMutation = (
  withReCaptcha: boolean,
) => `mutation UpdateCustomer($input: UpdateCustomerInput!${
  withReCaptcha ? ', $reCaptchaToken: String!' : ''
}) {
  customer {
    updateCustomer(input: $input${withReCaptcha ? ', reCaptchaV2: { token: $reCaptchaToken }' : ''}) {
      customer {
        firstName
        lastName
        company
        phoneNumber: phone
        email
      }
    }
  }
}`;

export async function updateCustomerDetails(
  input: UpdateCustomerInput,
  reCaptchaToken?: string,
): Promise<UpdateCustomerResponse> {
  return storefrontGQLRequest<UpdateCustomerResponse>({
    query: updateCustomerMutation(Boolean(reCaptchaToken)),
    variables: reCaptchaToken ? { input, reCaptchaToken } : { input },
  });
}

// ===========================================================================
// Update mutation (B2B company user: company.updateCompanyUser)
// ===========================================================================

// company.updateCompanyUser uses the same entityId-keyed form-field groups as
// customer.updateCustomer; only the scalar fields differ (it carries current/new
// password instead of company).
export interface UpdateCompanyUserInput {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  currentPassword?: string;
  newPassword?: string;
  formFields?: CustomerFormFieldsInput;
}

// The result's `errors` carries business validation failures (returned with a 200
// and no top-level GraphQL errors), so the caller must check it.
export interface UpdateCompanyUserResponse {
  data?: {
    company?: {
      updateCompanyUser?: {
        errors?: Array<{ code?: string; field?: string; message: string }>;
      };
    };
  };
  errors?: Array<{ message: string }>;
}

const MUTATION_UPDATE_COMPANY_USER = `mutation UpdateCompanyUser($input: UpdateCompanyUserInput!) {
  company {
    updateCompanyUser(input: $input) {
      errors {
        code
        field
        message
      }
    }
  }
}`;

export async function updateCompanyUserDetails(
  input: UpdateCompanyUserInput,
): Promise<UpdateCompanyUserResponse> {
  return storefrontGQLRequest<UpdateCompanyUserResponse>({
    query: MUTATION_UPDATE_COMPANY_USER,
    variables: { input },
  });
}
