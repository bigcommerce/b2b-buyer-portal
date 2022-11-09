import {
  B3Request,
} from '../../request/b3Fetch'

import {
  convertArrayToGraphql,
  storeHash,
} from '../../../../utils'

interface CustomFieldItems {
  [key: string]: any
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
    key,
    isEnabled
  }
}`

const getCompanyUserInfo = <T>(email: T) => `{
  companyUserInfo(storeHash:"${storeHash}", email:"${email}") {
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
    addressLine2: "${data.addressLine2}",
    city: "${data.city}",
    state: "${data.state}",
    zipCode: "${data.zip_code}",
    extraFields: ${convertArrayToGraphql(data.extraFields)}
    fileList: ${convertArrayToGraphql(data.fileList)}
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

const getStoreChannelId = () => `{
  storeBasicInfo(storeHash: "${storeHash}"){
    storeName
    storeAddress
    storeCountry
    storeLogo
    storeUrl
    storeSites{
        channelId
        urls
    }
  }
}`

// const getB2bLogin = () => `mutation Login() {
//   login(email: $email, password: $pass) {
//     result
//   }
// }`

export const getB2BAccountFormFields = (type: number): CustomFieldItems => B3Request.graphqlB2B({
  query: getAccountFormFields(type),
})

export const getB2BCompanyUserInfo = (email: string): CustomFieldItems => B3Request.graphqlB2B({
  query: getCompanyUserInfo(email),
})

export const getB2BRegisterLogo = (): CustomFieldItems => B3Request.graphqlB2B({
  query: getRegisterLogo(),
})

export const getB2BRegisterCustomFields = (): CustomFieldItems => B3Request.graphqlB2B({
  query: getCompanyExtraFields(),
})

export const getB2BCountries = (): CustomFieldItems => B3Request.graphqlB2B({
  query: getCountries(),
})

export const createB2BCompanyUser = (data: CustomFieldItems): CustomFieldItems => B3Request.graphqlB2B({
  query: createCompanyUser(data),
})

export const storeB2BBasicInfo = (): CustomFieldItems => B3Request.graphqlB2B({
  query: storeBasicInfo(),
})

export const getB2BLoginPageConfig = (): CustomFieldItems => B3Request.graphqlB2B({
  query: getLoginPageConfig(),
})

export const getBCForcePasswordReset = (email:string): CustomFieldItems => B3Request.graphqlB2B({
  query: getForcePasswordReset(email),
})

export const getBCStoreChannelId = () => B3Request.graphqlB2B({
  query: getStoreChannelId(),
})
