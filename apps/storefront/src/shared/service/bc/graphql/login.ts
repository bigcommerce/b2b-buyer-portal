import B3Request from '../../request/b3Fetch'

const getbcLogin = () => `mutation Login($email: String!, $pass: String!) {
  login(email: $email, password: $pass) {
    result,
    customer {
      entityId,
      phone,
      firstName,
      lastName,
      email,
      customerGroupId,
    }
  }
}`

const logoutLogin = () => `mutation Logout {
  logout {
    result
  }
}`

export const bcLogin = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlBC({
    query: getbcLogin(),
    variables: data,
  })

export const bcLogoutLogin = (): CustomFieldItems =>
  B3Request.graphqlBC({
    query: logoutLogin(),
  })
