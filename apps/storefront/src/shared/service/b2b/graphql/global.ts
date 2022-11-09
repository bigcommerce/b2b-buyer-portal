import {
  B3Request,
} from '../../request/b3Fetch'

const getB2BTokenQl = (bcJwtToken: string) => `mutation {
  authorization(authData: {
    bcToken: "${bcJwtToken}"
  }) {
    result {
      token
    }
  }
}`

const getAgentInfoQl = (customerId: string | number) => `{
  superAdminMasquerading(customerId: ${customerId}) {
    companyName,
    bcGroupName,
    companyStatus,
    id
  }
}`

const superAdminCompaniesQl = (id: number) => `{
  superAdminCompanies(
    superAdminId: ${id}
    offset: 0
    first: 10
  ) {
    edges{
      node{
        companyId,
        companyName,
        companyEmail,
      }
    }
  }
}`

const superAdminBeginMasqueradeQl = (companyId: string | number, userId: number) => `mutation {
  superAdminBeginMasquerade(
    companyId: ${companyId}
    userId: ${userId}
  ) {
    userInfo {
      email,
      phoneNumber,
    }
  }
}`

const superAdminEndMasqueradeQl = (companyId: string | number, userId: number) => `mutation {
  superAdminEndMasquerade(
    companyId: ${companyId}
    userId: ${userId}
  ) {
    message
  }
}`

const userCompanyQl = (userId: number) => `{
  userCompany(
    userId: ${userId}
  ) {
    companyName,
    companyStatus,
    id,
  }
}`

export const getB2BToken = (bcJwtToken: string) => B3Request.graphqlB2B({
  query: getB2BTokenQl(bcJwtToken),
})

export const getAgentInfo = (customerId: string | number) => B3Request.graphqlB2B({
  query: getAgentInfoQl(customerId),
})

export const superAdminCompanies = (id: number) => B3Request.graphqlB2B({
  query: superAdminCompaniesQl(id),
})

export const superAdminBeginMasquerade = (companyId: number, userId: number) => B3Request.graphqlB2B({
  query: superAdminBeginMasqueradeQl(companyId, userId),
})

export const superAdminEndMasquerade = (companyId: number, userId: number) => B3Request.graphqlB2B({
  query: superAdminEndMasqueradeQl(companyId, userId),
})

export const getUserCompany = (userId: number) => B3Request.graphqlB2B({
  query: userCompanyQl(userId),
})
