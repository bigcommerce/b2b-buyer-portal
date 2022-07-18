import { B3Request } from '../../request/b3Fetch'

interface CustomFieldItems {
  [key: string]: any
}

const storeHash = (window as any).b3?.setting?.storeHash || 'rtmh8fqr05'

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

export const getB2BCompanyUserInfo = (email: string): CustomFieldItems => B3Request.graphqlB2B({ query: getCompanyUserInfo(email) })

export const getB2BRegisterLogo = (): CustomFieldItems => B3Request.graphqlB2B({ query: getRegisterLogo() })

export const getB2BRegisterCustomFields = (): CustomFieldItems => B3Request.graphqlB2B({ query: getCompanyExtraFields() })

export const getB2BCountries = (): CustomFieldItems => B3Request.graphqlB2B({ query: getCountries() })
