import { channelId, convertArrayToGraphql, storeHash } from '../../../../utils'
import B3Request from '../../request/b3Fetch'

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
}`

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
}`

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
}`

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
    }
  }
}`

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
}`

const storeBasicInfo = () => `{
  storeBasicInfo(storeHash:"${storeHash}") {
    storeName
  }
}`

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
    ${
      data?.extraFields
        ? `extraFields: ${convertArrayToGraphql(data.extraFields)}`
        : ''
    }
    ${data?.fileList ? `fileList: ${convertArrayToGraphql(data.fileList)}` : ''}
    channelId: ${data.channelId || 1}
    ${
      data?.addressExtraFields
        ? `addressExtraFields: ${convertArrayToGraphql(
            data.addressExtraFields
          )}`
        : ''
    }
    ${
      data?.userExtraFields
        ? `userExtraFields: ${convertArrayToGraphql(data.userExtraFields)}`
        : ''
    }
  }) {
    company {
      id,
      companyStatus,
    }
  }
}`

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
}`

const getForcePasswordReset = (email: string) => `{
  companyUserInfo(storeHash: "${storeHash}", email: "${email}"){
    userType
    userInfo {
        forcePasswordReset
    }
  }
}`

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
}`

export const getB2BAccountFormFields = (type: number): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getAccountFormFields(type),
  })

export const getB2BCompanyUserInfo = (
  email: string,
  customerId: string | number
): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getCompanyUserInfo(email, customerId),
  })

export const getB2BRegisterLogo = (): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getRegisterLogo(),
  })

export const getB2BRegisterCustomFields = (): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getCompanyExtraFields(),
  })

export const getB2BCountries = (): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getCountries(),
  })

export const createB2BCompanyUser = (
  data: CustomFieldItems
): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: createCompanyUser(data),
  })

export const storeB2BBasicInfo = (): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: storeBasicInfo(),
  })

export const getB2BLoginPageConfig = (): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getLoginPageConfig(),
  })

export const getBCForcePasswordReset = (email: string): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getForcePasswordReset(email),
  })

export const getBCStoreChannelId = (): CustomFieldItems =>
  B3Request.graphqlB2B({
    query: getStoreChannelId,
    variables: { storeHash, bcChannelId: channelId },
  })
