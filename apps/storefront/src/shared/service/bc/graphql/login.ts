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

const getB2bLogin = `mutation Login($loginData: UserLoginType) {
  login(loginData: $loginData) {
    result{
      storefrontLoginToken
      token
    }
  }
}`

export const b2bLogin = (variables: LoginData): Promise<UserLoginResult> =>
  B3Request.graphqlB2B({
    query: getB2bLogin,
    variables,
  })

export const bcLogin = (data: CustomFieldItems): CustomFieldItems =>
  B3Request.graphqlBC({
    query: getbcLogin(),
    variables: data,
  })

export const bcLogoutLogin = (): CustomFieldItems =>
  B3Request.graphqlBC({
    query: logoutLogin(),
  })
