import {
  channelId,
  convertArrayToGraphql,
  convertObjectOrArrayKeysToCamel,
  storeHash,
} from '@/utils';

import B3Request from '../../request/b3Fetch';

interface FormField {
  name: string;
  value: string;
}
interface Address {
  address1: string;
  address2: string;
  address_type: string;
  city: string;
  company: string;
  country_code: string;
  first_name: string;
  last_name: string;
  phone: string;
  postal_code: string;
  state_or_province: string;
  form_fields: FormField[];
}

interface Authentication {
  force_password_reset: boolean;
  new_password: string;
}

interface StoreCreditAmount {
  amount: number;
}

interface CreateCustomer {
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
  authentication: Authentication;
  accepts_product_review_abandoned_cart_emails: boolean;
  store_credit_amounts: StoreCreditAmount[];
  origin_channel_id: number;
  channel_ids: number[];
  form_fields: FormField[];
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

const getAccountFormFields = (type: number) => `query B2BAccountFormFields {
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

const getCustomerInfo = () => `{
  customerInfo {
    userType,
    permissions {
      code
      permissionLevel
    },
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

const getCountries = () => `query Countries {
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

const getForcePasswordReset = (email: string) => `{
  userLoginState(storeHash: "${storeHash}", email: "${email}"){
    forcePasswordReset
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

const customerCreateBC = `mutation customerCreate($customerData: CustomerInputType!) {
  customerCreate(customerData: $customerData) {
    customer {
      id
      email
      firstName
      lastName
      phone
      company
      customerGroupId
    }
  }
}
`;

const customerSubscribersCreate = `mutation customerSubscribersCreate($subscribersData: CustomerSubscribersInputType!) {
  customerSubscribersCreate(subscribersData: $subscribersData) {
    customerSubscribers {
      id
    }
  }
}
`;

export const getB2BAccountFormFields = (type: number) =>
  B3Request.graphqlB2B({
    query: getAccountFormFields(type),
  });

export const getB2BCompanyUserInfo = () =>
  B3Request.graphqlB2B({
    query: getCustomerInfo(),
  });

export const getB2BCountries = () =>
  B3Request.graphqlB2B({
    query: getCountries(),
  });

export const createB2BCompanyUser = (data: CustomFieldItems) =>
  B3Request.graphqlB2B({
    query: createCompanyUser(data),
  });

export const getBCForcePasswordReset = (email: string) =>
  B3Request.graphqlB2B({
    query: getForcePasswordReset(email),
  }).then((res) => res.userLoginState.forcePasswordReset);

export const getBCStoreChannelId = () =>
  B3Request.graphqlB2B({
    query: getStoreChannelId,
    variables: { storeHash, bcChannelId: channelId },
  });

export const createBCCompanyUser = (customerData: Partial<CreateCustomer>) =>
  B3Request.graphqlB2B({
    query: customerCreateBC,
    variables: { customerData: convertObjectOrArrayKeysToCamel(customerData) },
  });

export const sendSubscribersState = (data: Partial<CustomerSubscribers>) =>
  B3Request.graphqlB2B({
    query: customerSubscribersCreate,
    variables: { subscribersData: convertObjectOrArrayKeysToCamel(data) },
  });
