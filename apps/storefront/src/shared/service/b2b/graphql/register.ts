import { CreateCustomer, CustomerSubscribers } from '@/types';
import { channelId, convertArrayToGraphql, storeHash } from '@/utils';

import B3Request from '../../request/b3Fetch';

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
        storeHash: "${data.storeHash}",
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
          data.accepts_product_review_abandoned_cart_emails || false
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
        storeHash: "${data.storeHash}",
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
