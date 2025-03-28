import { platform } from '@/utils';

import B3Request from '../../request/b3Fetch';

interface LoginData {
  loginData: {
    storeHash: string;
    email: string;
    password: string;
    channelId: number;
  };
}

interface UserLoginResult {
  login: {
    result: {
      token: string;
      storefrontLoginToken: string;
      permissions: [
        {
          code: string;
          permissionLevel: number;
        },
      ];
    };
    errors?: { message: string }[];
  };
}

const getBcLogin = () => `mutation Login($email: String!, $password: String!) {
  login(email: $email, password: $password) {
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
}`;

const logoutLogin = () => `mutation Logout {
  logout {
    result
  }
}`;

const getB2bLogin = `mutation Login($loginData: UserLoginType!) {
  login(loginData: $loginData) {
    result{
      storefrontLoginToken
      token
      permissions {
        code
        permissionLevel
      }
    }
  }
}`;
// customMessage: field used to determine whether to use a custom message
export const b2bLogin = (variables: LoginData, customMessage = true): Promise<UserLoginResult> =>
  B3Request.graphqlB2B(
    {
      query: getB2bLogin,
      variables,
    },
    customMessage,
  );

interface LoginVariables {
  email: string;
  password: string;
}

export const bcLogin = (variables: LoginVariables) => {
  const query = getBcLogin();

  return platform === 'bigcommerce'
    ? B3Request.graphqlBC({ query, variables })
    : B3Request.graphqlBCProxy({ query, variables });
};

export const bcLogoutLogin = () =>
  platform === 'bigcommerce'
    ? B3Request.graphqlBC({
        query: logoutLogin(),
      })
    : B3Request.graphqlBCProxy({
        query: logoutLogin(),
      });
