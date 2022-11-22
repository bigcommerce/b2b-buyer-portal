import {
  B3Request,
} from '../../request/b3Fetch'

const getbcLogin = () => `mutation Login($email: String!, $pass: String!) {
  login(email: $email, password: $pass) {
    result
  }
}`

const logoutLogin = () => `mutation Logout {
  logout {
    result
  }
}`

export const bcLogin = (data: CustomFieldItems): CustomFieldItems => B3Request.graphqlBC({
  query: getbcLogin(),
  variables: data,
})

export const bcLogoutLogin = (): CustomFieldItems => B3Request.graphqlBC({
  query: logoutLogin(),
})
