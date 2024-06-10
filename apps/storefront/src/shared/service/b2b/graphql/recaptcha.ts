import B3Request from '../../request/b3Fetch';

const getStorefrontTokenQuery = `query {
    site {
        settings {
            reCaptcha {
                siteKey
                isEnabledOnStorefront
            }
        }
    }
}`;

const resetPassword = `mutation recaptcha($token: String!, $email: String!) {
    customer {
      requestResetPassword(
        reCaptchaV2: { 
            token: $token
        },
        input: {
          email: $email,
        }
      ) {
        errors {
          ... on ValidationError {
            message
          }
        }
      }
    }
  }
`;

export const requestResetPassword = (token: string, email: string) =>
  B3Request.graphqlBCProxy({
    query: resetPassword,
    variables: { token, email },
  });

export const getStorefrontToken = () =>
  B3Request.graphqlBCProxy({
    query: getStorefrontTokenQuery,
  });
