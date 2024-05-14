import { platform } from '@/utils'

import B3Request from '../../request/b3Fetch'

interface LoginData {
  loginData: {
    storeHash: string
    email: string
    password: string
    channelId: number
  }
}

interface UserLoginResult {
  login: {
    result: {
      token: string
      storefrontLoginToken: string
    }
    errors?: { message: string }[]
  }
}

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

const getB2bLogin = `mutation Login($loginData: UserLoginType!) {
  login(loginData: $loginData) {
    result{
      storefrontLoginToken
      token
    }
  }
}`
// customMessage: field used to determine whether to use a custom message
export const b2bLogin = (
  variables: LoginData,
  customMessage = true
): Promise<UserLoginResult> =>
  B3Request.graphqlB2B(
    {
      query: getB2bLogin,
      variables,
    },
    customMessage
  )

export const bcLogin = (data: CustomFieldItems): CustomFieldItems =>
  platform === 'bigcommerce'
    ? B3Request.graphqlBC({
        query: getbcLogin(),
        variables: data,
      })
    : B3Request.graphqlBCProxy({
        query: getbcLogin(),
        variables: data,
      })

export const bcLogoutLogin = (): CustomFieldItems =>
  platform === 'bigcommerce'
    ? B3Request.graphqlBC({
        query: logoutLogin(),
      })
    : B3Request.graphqlBCProxy({
        query: logoutLogin(),
      })
