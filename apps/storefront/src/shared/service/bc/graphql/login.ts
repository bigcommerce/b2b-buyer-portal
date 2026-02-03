import { platform } from '@/utils/basicConfig';
import { mapToCompanyError } from '@/utils/companyUtils';

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
    errors?: Array<{ message: string }>;
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

export const b2bLogin = (variables: LoginData): Promise<UserLoginResult> =>
  B3Request.graphqlB2B<UserLoginResult>(
    {
      query: getB2bLogin,
      variables,
    },
    true,
  ).catch(mapToCompanyError);

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
