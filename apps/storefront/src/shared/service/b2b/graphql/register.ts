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
    visibleToEnduser,
    labelName,
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

const storeBasicInfo = () => `{
  storeBasicInfo(storeHash:"${storeHash}") {
    storeName
  }
}`

const conversionData = (data: CustomFieldItems) => {
  if (typeof data === 'string' || typeof data === 'number') {
    return data
  }
  let str = '{'
  Object.keys(data).forEach((item: any, index) => {
    if (typeof data[item] === 'string' || typeof data[item] === 'number' || typeof data[item] === 'undefined') {
      if (index === Object.keys(data).length - 1) {
        str += `${item}: `
        str += `${JSON.stringify(data[item])}`
      } else {
        str += `${item}: `
        str += `${JSON.stringify(data[item])}, `
      }
    }

    if (Object.prototype.toString.call(data[item]) === '[object Object]') {
      str += `${item}: `
      str += conversionData(data[item])
    }

    if (Object.prototype.toString.call(data[item]) === '[object Array]') {
      str += `${item}: [`
      data[item].forEach((list: any) => {
        str += conversionData(list)
      })
      str += '],'
    }
  })
  str += '},'

  return str
}

const conversionArr = (data: CustomFieldItems) => {
  let str = '['
  data.forEach((list: any) => {
    str += conversionData(list)
  })
  str += ']'

  return str
}

const createCompanyUser = (data: any) => `mutation{
  companyCreate(companyData: {
    customerId: "${data.customerId || 2945}",
    storeHash: "${data.storeHash}",
    companyName: "${data.companyName}",
    companyEmail: "${data.companyEmail}",
    companyPhoneNumber: "${data.companyPhoneNumber}",
    country: "${data.country}",
    addressLine1: "${data.addressLine1}",
    addressLine2: "${data.addressLine2}",
    city: "${data.city}",
    state: "${data.state}",
    zipCode: "${data.zipCode}",
    extraFields: ${conversionArr(data.extraFields)}}) {
    company {
      id,
      companyStatus,
    }
  }
}`

export const getB2BCompanyUserInfo = (email: string): CustomFieldItems => B3Request.graphqlB2B({ query: getCompanyUserInfo(email) })

export const getB2BRegisterLogo = (): CustomFieldItems => B3Request.graphqlB2B({ query: getRegisterLogo() })

export const getB2BRegisterCustomFields = (): CustomFieldItems => B3Request.graphqlB2B({ query: getCompanyExtraFields() })

export const getB2BCountries = (): CustomFieldItems => B3Request.graphqlB2B({ query: getCountries() })

export const createB2BCompanyUser = (data: CustomFieldItems): CustomFieldItems => B3Request.graphqlB2B({ query: createCompanyUser(data) })

export const storeB2BBasicInfo = (): CustomFieldItems => B3Request.graphqlB2B({ query: storeBasicInfo() })
