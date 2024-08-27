import { channelId, convertArrayToGraphql, storeHash } from '@/utils';

import B3Request from '../../request/b3Fetch';

interface FormField {
  name: string;
  value: string;
}

interface Address {
  firstName: string;
  lastName: string;
  company: string;
  address1: string;
  address2: string;
  city: string;
  phone: string;
  stateOrProvince: string;
  countryCode: string;
  postalCode: string;
  addressType: string;
  formFields: FormField[];
}

interface Attribute {
  attributeId: number;
  attributeValue: string;
}

interface Authentication {
  force_password_reset: boolean;
  new_password: string;
}

interface StoreCreditAmount {
  amount: number;
}

export interface CreateCustomer {
  storeHash: string;
  email: string;
  first_name: string;
  last_name: string;
  company: string;
  phone: string;
  notes: string;
  tax_exempt_category: string;
  customer_group_id: number;
  addresses: Address[];
  attributes?: Attribute[];
  authentication: Authentication;
  accepts_product_review_abandoned_cart_emails: boolean;
  store_credit_amounts: StoreCreditAmount[];
  origin_channel_id: number;
  channel_ids: number[];
  form_fields: FormField[];
  trigger_account_created_notification?: boolean;
}

interface CustomerSubscribers {
  storeHash: string;
  email: string;
  first_name: string;
  last_name: string;
  source: string;
  order_id: number;
  channel_id: number;
}

const getAccountFormFields = (type: number) => `{
  accountFormFields(storeHash: "${storeHash}", formType: ${type}){
    id
    formType
    fieldFrom
    fieldId
    fieldIndex
    custom
    groupId
    groupName
    isRequired
    visible
    labelName
    fieldName
    fieldType
    valueConfigs
    createdAt
    updatedAt
    }
}`;

const getCompanyExtraFields = () => `{
  companyExtraFields(storeHash: "${storeHash}") {
    fieldName,
    fieldType,
    isRequired,
    defaultValue,
    maximumLength,
    maximumLength,
    maximumValue,
    listOfValue,
    visibleToEnduser,
    labelName,
    numberOfRows,
  }
}`;

const getRegisterLogo = () => `{
  quoteConfig(storeHash: "${storeHash}") {
    switchStatus{
      key
      isEnabled
    }
    otherConfigs{
      key
      value
    }
  }
}`;

const getCompanyUserInfo = <T>(email: T, customerId: string | number) => `{
  companyUserInfo(storeHash:"${storeHash}", email:"${email}", ${`customerId: ${customerId}`}) {
    userType,
    userInfo {
      id
      phoneNumber
      lastName
      email
      firstName
      role
      companyRoleId
      companyRoleName
    }
  }
}`;

const getCountries = () => `{
  countries(storeHash:"${storeHash}") {
    id
    countryName
    countryCode
    states {
      stateName
      stateCode
    }
  }
}`;

const storeBasicInfo = () => `{
  storeBasicInfo(storeHash:"${storeHash}") {
    storeName
  }
}`;

const createCompanyUser = (data: any) => `mutation{
  companyCreate(companyData: {
    customerId: "${data.customerId}",
    storeHash: "${data.storeHash}",
    companyName: "${data.companyName}",
    companyEmail: "${data.companyEmail}",
    companyPhoneNumber: "${data.companyPhoneNumber || ''}",
    country: "${data.country}",
    addressLine1: "${data.addressLine1}",
    addressLine2: "${data.addressLine2 || ''}",
    city: "${data.city}",
    state: "${data.state}",
    zipCode: "${data.zip_code}",
    ${data?.extraFields ? `extraFields: ${convertArrayToGraphql(data.extraFields)}` : ''}
    ${data?.fileList ? `fileList: ${convertArrayToGraphql(data.fileList)}` : ''}
    channelId: ${data.channelId || 1}
    ${
      data?.addressExtraFields
        ? `addressExtraFields: ${convertArrayToGraphql(data.addressExtraFields)}`
        : ''
    }
    ${
      data?.userExtraFields ? `userExtraFields: ${convertArrayToGraphql(data.userExtraFields)}` : ''
    }
  }) {
    company {
      id,
      companyStatus,
    }
  }
}`;

const getLoginPageConfig = () => `{
  loginPageConfig(storeHash: "${storeHash}") {
    id
    value{
      displayStoreLogo
      pageTitle
      signInButtonText
      createAccountButtonText
      primaryButtonColor
      createAccountPanelHtml
      topHtmlRegionHtml
      topHtmlRegionEnabled
      bottomHtmlRegionHtml
      bottomHtmlRegionEnabled
    }
  }
}`;

const getForcePasswordReset = (email: string) => `{
  companyUserInfo(storeHash: "${storeHash}", email: "${email}"){
    userType
    userInfo {
        forcePasswordReset
    }
  }
}`;

const getStoreChannelId = `
query getStoreBasicInfo($storeHash: String!, $bcChannelId: Int) {
  storeBasicInfo(storeHash: $storeHash, bcChannelId: $bcChannelId){
    storeName
    storeAddress
    storeCountry
    storeLogo
    storeUrl
    multiStorefrontEnabled
    storeSites{
      channelId
      urls
      iconUrl
      channelLogo
      isEnabled
      b2bEnabled
      b3ChannelId
      type
      platform
      translationVersion
    }
    timeFormat{
      display
      export
      extendedDisplay
      offset
    }
  }
}`;

const customerCreate = (data: CreateCustomer) => `mutation {
    customerCreate(
      customerData: {
        storeHash: "${storeHash}",
        email: "${data.email}",
        firstName: "${data.first_name}",
        lastName: "${data.last_name}",
        company: "${data.company}",
        phone: "${data.phone}",
        notes: "${data?.notes || ''}",
        taxExemptCategory: "${data.tax_exempt_category || ''}",
        ${data?.customer_group_id ? `customerGroupId: ${data?.customer_group_id}` : ''},
        addresses: ${convertArrayToGraphql(data?.addresses || [])},
        attributes: ${convertArrayToGraphql(data?.attributes || [])},
        ${
          data?.authentication
            ? `authentication: {
          forcePasswordReset: ${data.authentication.force_password_reset},
          newPassword: "${data.authentication.new_password}",
        }`
            : ''
        },
        acceptsProductReviewAbandonedCartEmails: ${
          data.accepts_product_review_abandoned_cart_emails
        },
        storeCreditAmounts: ${convertArrayToGraphql(data?.store_credit_amounts || [])},
        originChannelId: ${data.origin_channel_id},
        channelIds: ${convertArrayToGraphql(data?.channel_ids || [])},
        formFields: ${convertArrayToGraphql(data?.form_fields || [])},
        triggerAccountCreatedNotification: ${data?.trigger_account_created_notification || false},
      }
    ) {
      customer {
        id,
        email,
        firstName,
        lastName,
        company,
        phone,
        notes,
        taxExemptCategory,
        registrationIpAddress,
        customerGroupId,
        dateModified,
        dateCreated,
        addressCount,
        attributeCount,
        authentication {
          forcePasswordReset
        }
        addresses {
          firstName,
          lastName,
          company,
          address1,
          address2,
          city,
          stateOrProvince,
          postalCode,
          countryCode,
          phone,
          addressType,
          customerId,
          id,
          country,
          formFields {
            name,
            value,
          }
        }
        attributes {
          id,
          attributeId,
          attributeValue,
          customerId,
          dateCreated,
          dateModified,
        }
        formFields {
          name,
          value,
        }
        storeCreditAmounts {
          amount,
        }
        acceptsProductReviewAbandonedCartEmails,
        originChannelId,
        channelIds,
      }
    }
}
`;

const customerSubscribersCreate = (data: CustomerSubscribers) => `mutation {
    customerSubscribersCreate(
      subscribersData: {
        storeHash: "${storeHash}",
        email: "${data.email}",
        firstName: "${data.first_name}",
        lastName: "${data.last_name}",
        source: "${data?.source || ''}",
        ${data?.order_id ? `orderId: ${data.order_id},` : ''}
        channelId: ${data.channel_id},
      }
    ) {
      customerSubscribers {
        email,
        firstName,
        lastName,
        source,
        orderId,
        channelId,
        id,
        dateCreated,
        dateModified,
        consents,
      }
    }
}`;

export const getB2BAccountFormFields = (type: number) =>
  B3Request.graphqlB2B({
    query: getAccountFormFields(type),
  });

export const getB2BCompanyUserInfo = (email: string, customerId: string | number) =>
  B3Request.graphqlB2B({
    query: getCompanyUserInfo(email, customerId),
  });

export const getB2BRegisterLogo = () =>
  B3Request.graphqlB2B({
    query: getRegisterLogo(),
  });

export const getB2BRegisterCustomFields = () =>
  B3Request.graphqlB2B({
    query: getCompanyExtraFields(),
  });

export const getB2BCountries = () =>
  B3Request.graphqlB2B({
    query: getCountries(),
  });

export const createB2BCompanyUser = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: createCompanyUser(data),
  });

export const storeB2BBasicInfo = () =>
  B3Request.graphqlB2B({
    query: storeBasicInfo(),
  });

export const getB2BLoginPageConfig = () =>
  B3Request.graphqlB2B({
    query: getLoginPageConfig(),
  });

export const getBCForcePasswordReset = (email: string) =>
  B3Request.graphqlB2B({
    query: getForcePasswordReset(email),
  }).then((res) => res.companyUserInfo.userInfo.forcePasswordReset);

export const getBCStoreChannelId = () =>
  B3Request.graphqlB2B({
    query: getStoreChannelId,
    variables: { storeHash, bcChannelId: channelId },
  });

export const createBCCompanyUser = (data: CreateCustomer) =>
  B3Request.graphqlB2B({
    query: customerCreate(data),
  });

export const sendSubscribersState = (data: CustomerSubscribers) =>
  B3Request.graphqlB2B({
    query: customerSubscribersCreate(data),
  });
