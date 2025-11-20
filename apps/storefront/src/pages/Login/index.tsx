import { useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box, ImageListItem } from '@mui/material';

import b2bLogo from '@/assets/b2bLogo.png';
import { B3Card } from '@/components';
import B3Spin from '@/components/spin/B3Spin';
import { CHECKOUT_URL, PATH_ROUTES } from '@/constants';
import { dispatchEvent } from '@/hooks/useB2BCallback';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { defaultCreateAccountPanel } from '@/shared/customStyleButton/context/config';
import { GlobalContext } from '@/shared/global';
import { getBCForcePasswordReset } from '@/shared/service/b2b/graphql/register';
import { b2bLogin, bcLogin, customerLoginAPI } from '@/shared/service/bc';
import { isLoggedInSelector, useAppDispatch, useAppSelector } from '@/store';
import { setB2BToken } from '@/store/slices/company';
import { CustomerRole, UserTypes } from '@/types';
import { LoginFlagType } from '@/types/login';
import { channelId, loginJump, platform, snackbar, storeHash } from '@/utils';
import { b2bJumpPath } from '@/utils/b3CheckPermissions/b2bPermissionPath';
import b2bLogger from '@/utils/b3Logger';
import { getAssetUrl } from '@/utils/getAssetUrl';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';

import { type PageProps } from '../PageProps';

import LoginWidget from './component/LoginWidget';
import { CatalystLogin } from './CatalystLogin';
import { isLoginFlagType, loginCheckout, LoginConfig, loginType } from './config';
import LoginForm from './LoginForm';
import LoginPanel from './LoginPanel';
import { LoginContainer, LoginImage } from './styled';
import { useLogout } from './useLogout';

const errorMap: Record<string, string> = {
  'Your business account is pending approval. You will gain access to business account features, products, and pricing after account approval.':
    'global.statusNotifications.willGainAccessToBusinessFeatProductsAndPricingAfterApproval',
  'Your business account is pending approval. Products, pricing, and ordering will be enabled after account approval.':
    'global.statusNotifications.productsPricingAndOrderingWillBeEnabledAfterApproval',
  'Your business account is pending approval. You will gain access to business account features after account approval.':
    'global.statusNotifications.willGainAccessToBusinessFeatAfterApproval',
};

function Login(props: PageProps) {
  const { setOpenPage } = props;
  const storeDispatch = useAppDispatch();
  const logout = useLogout();

  const isLoggedIn = useAppSelector(isLoggedInSelector);

  const quoteDetailToCheckoutUrl = useAppSelector(
    ({ quoteInfo }) => quoteInfo.quoteDetailToCheckoutUrl,
  );

  const [isLoading, setLoading] = useState(true);
  const [isMobile] = useMobile();

  const [showTipInfo, setShowTipInfo] = useState<boolean>(true);
  const [flag, setLoginFlag] = useState<LoginFlagType>();
  const [loginAccount, setLoginAccount] = useState<LoginConfig>({
    email: '',
    password: '',
  });
  const navigate = useNavigate();
  const b3Lang = useB3Lang();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    state: { isCheckout, logo, registerEnabled },
  } = useContext(GlobalContext);

  const {
    state: {
      loginPageButton,
      loginPageDisplay,
      loginPageHtml,
      portalStyle: { backgroundColor = 'FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const { createAccountButtonText, primaryButtonColor, signInButtonText } = loginPageButton;
  const { displayStoreLogo, pageTitle } = loginPageDisplay;

  const {
    bottomHtmlRegionEnabled,
    bottomHtmlRegionHtml,
    createAccountPanelHtml,
    topHtmlRegionEnabled,
    topHtmlRegionHtml,
  } = loginPageHtml;

  const loginInfo = {
    loginTitle: pageTitle || b3Lang('login.button.signIn'),
    loginBtn: signInButtonText || b3Lang('login.button.signInUppercase'),
    createAccountButtonText: createAccountButtonText || b3Lang('login.button.createAccount'),
    btnColor: primaryButtonColor || '',
    widgetHeadText: topHtmlRegionEnabled ? topHtmlRegionHtml : undefined,
    widgetBodyText: createAccountPanelHtml || defaultCreateAccountPanel,
    widgetFooterText: bottomHtmlRegionEnabled ? bottomHtmlRegionHtml : undefined,
    logo: displayStoreLogo ? logo : undefined,
  };

  useEffect(() => {
    (async () => {
      try {
        const loginFlag = searchParams.get('loginFlag');
        const showTipInfo = searchParams.get('showTip') !== 'false';

        setShowTipInfo(showTipInfo);

        if (isLoginFlagType(loginFlag)) {
          setLoginFlag(loginFlag);
        }

        if (loginFlag === 'invoiceErrorTip') {
          const { tip } = loginType[loginFlag];
          snackbar.error(b3Lang(tip));
        }

        if (loginFlag === 'loggedOutLogin' && isLoggedIn) {
          await logout();
        }

        setLoading(false);
      } finally {
        setLoading(false);
      }
    })();
  }, [b3Lang, isLoggedIn, logout, searchParams]);

  const tipInfo = (loginFlag: LoginFlagType, email = '') => {
    const { tip, alertType } = loginType[loginFlag];

    return {
      message: b3Lang(tip, { email }),
      severity: alertType,
    };
  };

  const getForcePasswordReset = async (email: string) => {
    const forcePasswordReset = await getBCForcePasswordReset(email);

    if (forcePasswordReset) {
      setLoginFlag('resetPassword');
    } else {
      setLoginFlag('accountIncorrect');
    }
  };

  const forcePasswordReset = async (email: string, password: string) => {
    const { errors: bcErrors } = await bcLogin({ email, password });

    if (bcErrors?.[0]) {
      const { message } = bcErrors[0];

      if (message === 'Reset password') {
        getForcePasswordReset(email);
        return true;
      }
    }

    return false;
  };

  const handleLoginSubmit = async (data: LoginConfig) => {
    setLoading(true);
    setLoginAccount(data);
    setSearchParams((prevURLSearchParams) => {
      prevURLSearchParams.delete('loginFlag');
      return prevURLSearchParams;
    });

    if (isCheckout) {
      try {
        const response = await loginCheckout(data);

        if (response.status === 400 && response.type === 'reset_password_before_login') {
          setLoginFlag('resetPassword');
        } else if (response.type === 'invalid_login') {
          setLoginFlag('accountIncorrect');
        } else {
          window.location.href = CHECKOUT_URL;
        }
      } catch (error) {
        b2bLogger.error(error);
        await getForcePasswordReset(data.email);
      } finally {
        setLoading(false);
      }
    } else {
      try {
        const loginData = {
          email: data.email,
          password: data.password,
          storeHash,
          channelId,
        };

        const isForcePasswordReset = await forcePasswordReset(data.email, data.password);
        if (isForcePasswordReset) return;

        const {
          login: {
            result: { token, storefrontLoginToken },
            errors,
          },
        } = await b2bLogin({ loginData });

        storeDispatch(setB2BToken(token));
        customerLoginAPI(storefrontLoginToken);

        dispatchEvent('on-login', { storefrontToken: storefrontLoginToken });

        if (errors?.[0] || !token) {
          if (errors?.[0]) {
            const { message } = errors[0];
            if (message === 'Operation cannot be performed as the storefront channel is not live') {
              setLoginFlag('accountPrelaunch');
              setLoading(false);
              return;
            }
          }
          getForcePasswordReset(data.email);
        } else {
          const info = await getCurrentCustomerInfo(token);

          if (quoteDetailToCheckoutUrl) {
            navigate(quoteDetailToCheckoutUrl);
            return;
          }

          if (
            info?.userType === UserTypes.MULTIPLE_B2C &&
            info?.role === CustomerRole.SUPER_ADMIN
          ) {
            navigate('/dashboard');
            return;
          }
          const isLoginLandLocation = loginJump(navigate);

          if (!isLoginLandLocation) return;

          if (info?.userType === UserTypes.B2C) {
            navigate(PATH_ROUTES.ORDERS);
          }

          const path = b2bJumpPath(Number(info?.role));

          navigate(path);
        }
      } catch (error: unknown) {
        if (error instanceof Error) {
          const i18nKey = errorMap[error.message];
          if (i18nKey) {
            snackbar.error(b3Lang(i18nKey));
            await logout(false);
          } else {
            snackbar.error(b3Lang('login.loginTipInfo.accountIncorrect'));
          }
        }
      } finally {
        setLoading(false);
      }
    }
  };

  const loginAndRegisterContainerWidth = registerEnabled ? '100%' : '50%';
  const loginContainerWidth = registerEnabled ? '50%' : 'auto';

  const tip = flag && tipInfo(flag, loginAccount?.email);

  return (
    <B3Card setOpenPage={setOpenPage}>
      <LoginContainer paddings={isMobile ? '0' : '20px 20px'}>
        <B3Spin isSpinning={isLoading} tip={b3Lang('global.tips.loading')} background="transparent">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              minHeight: '400px',
              minWidth: '343px',
            }}
          >
            {loginInfo && (
              <>
                {flag && showTipInfo && (
                  <Box
                    sx={{
                      padding: isMobile ? 0 : '0 5%',
                      margin: '30px 0 0 0',
                    }}
                  >
                    {tip && (
                      <Alert severity={tip.severity} variant="filled">
                        {tip.message}
                      </Alert>
                    )}
                  </Box>
                )}
                {quoteDetailToCheckoutUrl && (
                  <Alert severity="error" variant="filled">
                    {b3Lang('login.loginText.quoteDetailToCheckoutUrl')}
                  </Alert>
                )}
                <Box sx={{ margin: '20px 0', minHeight: '150px' }}>
                  <LoginImage>
                    <ImageListItem
                      sx={{
                        maxWidth: isMobile ? '70%' : '250px',
                      }}
                      onClick={() => {
                        window.location.href = '/';
                      }}
                    >
                      <img
                        src={loginInfo.logo || getAssetUrl(b2bLogo)}
                        alt={b3Lang('login.registerLogo')}
                        loading="lazy"
                      />
                    </ImageListItem>
                  </LoginImage>
                </Box>
                {loginInfo.widgetHeadText && (
                  <LoginWidget
                    sx={{
                      minHeight: '48px',
                      width: registerEnabled || isMobile ? '100%' : '50%',
                    }}
                    html={loginInfo.widgetHeadText}
                  />
                )}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                  }}
                >
                  <Box
                    sx={{
                      bgcolor: '#FFFFFF',
                      borderRadius: '4px',
                      margin: '20px 0',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'center',
                      width: isMobile ? 'auto' : loginAndRegisterContainerWidth,
                    }}
                  >
                    <Box
                      sx={{
                        mb: '20px',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'center',
                        width: isMobile ? 'auto' : '100%',
                      }}
                    >
                      <Box
                        sx={{
                          width: isMobile ? 'auto' : loginContainerWidth,
                          paddingRight: isMobile ? 0 : '2%',
                          ml: '16px',
                          mr: isMobile ? '16px' : '',
                          pb: registerEnabled ? '' : '36px',
                        }}
                      >
                        <LoginForm
                          loginBtn={loginInfo.loginBtn}
                          handleLoginSubmit={handleLoginSubmit}
                          backgroundColor={backgroundColor}
                        />
                      </Box>

                      {registerEnabled && (
                        <Box
                          sx={{
                            flex: '1',
                            paddingLeft: isMobile ? 0 : '2%',
                          }}
                        >
                          <LoginPanel
                            createAccountButtonText={loginInfo.createAccountButtonText}
                            widgetBodyText={loginInfo.widgetBodyText}
                          />
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Box>
                {loginInfo.widgetFooterText && (
                  <LoginWidget
                    sx={{
                      minHeight: '48px',
                      width: registerEnabled || isMobile ? '100%' : '50%',
                    }}
                    html={loginInfo.widgetFooterText}
                  />
                )}
              </>
            )}
          </Box>
        </B3Spin>
      </LoginContainer>
    </B3Card>
  );
}

export default function LoginPage(props: PageProps) {
  if (platform === 'catalyst') {
    return <CatalystLogin />;
  }

  return <Login {...props} />;
}
