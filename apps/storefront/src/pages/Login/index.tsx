import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { B2BEvent, useB2BCallback } from '@b3/hooks';
import { useB3Lang } from '@b3/lang';
import { Alert, Box, ImageListItem } from '@mui/material';

import { B3Card } from '@/components';
import B3Spin from '@/components/spin/B3Spin';
import { CHECKOUT_URL, PATH_ROUTES } from '@/constants';
import { useMobile } from '@/hooks';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { defaultCreateAccountPanel } from '@/shared/customStyleButton/context/config';
import { GlobalContext } from '@/shared/global';
import {
  endUserMasqueradingCompany,
  getBCForcePasswordReset,
  superAdminEndMasquerade,
} from '@/shared/service/b2b';
import { b2bLogin, bcLogin, bcLogoutLogin, customerLoginAPI } from '@/shared/service/bc';
import {
  clearMasqueradeCompany,
  isLoggedInSelector,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { setB2BToken } from '@/store/slices/company';
import { CustomerRole, UserTypes } from '@/types';
import { AlertColor, LoginFlagType } from '@/types/login';
import { b2bJumpPath, channelId, loginJump, snackbar, storeHash } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import { logoutSession } from '@/utils/b3logout';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';

import { type PageProps } from '../PageProps';

import LoginWidget from './component/LoginWidget';
import { CatalystLogin } from './CatalystLogin';
import { isLoginFlagType, loginCheckout, LoginConfig, loginType } from './config';
import LoginForm from './LoginForm';
import LoginPanel from './LoginPanel';
import { LoginContainer, LoginImage } from './styled';

const useMasquerade = () => {
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const storeDispatch = useAppDispatch();

  const endMasquerade = useCallback(async () => {
    if (isAgenting) {
      await superAdminEndMasquerade(Number(salesRepCompanyId));
      storeDispatch(clearMasqueradeCompany());
    }
  }, [salesRepCompanyId, storeDispatch, isAgenting]);

  return { endMasquerade, isAgenting };
};

const setTipType = (flag: LoginFlagType): AlertColor | undefined => {
  if (!flag) return undefined;

  const { alertType } = loginType[flag];

  return alertType;
};

function Login(props: PageProps) {
  const { isAgenting, endMasquerade } = useMasquerade();
  const { setOpenPage } = props;
  const storeDispatch = useAppDispatch();

  const isLoggedIn = useAppSelector(isLoggedInSelector);

  const quoteDetailToCheckoutUrl = useAppSelector(
    ({ quoteInfo }) => quoteInfo.quoteDetailToCheckoutUrl,
  );

  const [isLoading, setLoading] = useState(true);
  const [isMobile] = useMobile();

  const [showTipInfo, setShowTipInfo] = useState<boolean>(true);
  const [flag, setLoginFlag] = useState<LoginFlagType>('');
  const [loginAccount, setLoginAccount] = useState<LoginConfig>({
    emailAddress: '',
    password: '',
  });
  const navigate = useNavigate();
  const b3Lang = useB3Lang();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    state: { isCheckout, logo, registerEnabled },
  } = useContext(GlobalContext);

  const { selectCompanyHierarchyId } = useAppSelector(
    ({ company }) => company.companyHierarchyInfo,
  );

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
    const logout = async () => {
      try {
        const loginFlag = searchParams.get('loginFlag');
        const showTipInfo = searchParams.get('showTip') !== 'false';

        setShowTipInfo(showTipInfo);

        if (loginFlag && isLoginFlagType(loginFlag)) setLoginFlag(loginFlag);

        if (loginFlag === 'invoiceErrorTip') {
          const { tip } = loginType[loginFlag];
          snackbar.error(b3Lang(tip));
        }
        if (loginFlag === 'loggedOutLogin' && isLoggedIn) {
          try {
            const { result } = (await bcLogoutLogin()).data.logout;

            if (result !== 'success') return;

            if (isAgenting) {
              await endMasquerade();
            }

            if (selectCompanyHierarchyId) {
              await endUserMasqueradingCompany();
            }
          } catch (e) {
            b2bLogger.error(e);
          } finally {
            // SUP-1282 Clear sessionStorage to allow visitors to display the checkout page
            window.sessionStorage.clear();
            logoutSession();
            window.b2b.callbacks.dispatchEvent(B2BEvent.OnLogout);
            setLoading(false);
          }
        }
        setLoading(false);
      } finally {
        setLoading(false);
      }
    };

    logout();
  }, [b3Lang, endMasquerade, isLoggedIn, isAgenting, searchParams, selectCompanyHierarchyId]);

  const tipInfo = (loginFlag?: LoginFlagType, email = '') => {
    if (!loginFlag) return '';

    const { tip } = loginType[loginFlag];

    if (flag === 'resetPassword') {
      b3Lang(tip, {
        email,
      });
    }

    return b3Lang(tip);
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
    const { errors: bcErrors } = await bcLogin({
      email,
      pass: password,
    });

    if (bcErrors?.[0]) {
      const { message } = bcErrors[0];

      if (message === 'Reset password') {
        getForcePasswordReset(email);
        return true;
      }
    }

    return false;
  };

  const handleLoginSubmit = useB2BCallback(
    B2BEvent.OnLogin,
    async (dispatchOnLoginEvent, data: LoginConfig) => {
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
          await getForcePasswordReset(data.emailAddress);
        } finally {
          setLoading(false);
        }
      } else {
        try {
          const loginData = {
            email: data.emailAddress,
            password: data.password,
            storeHash,
            channelId,
          };

          const isForcePasswordReset = await forcePasswordReset(data.emailAddress, data.password);
          if (isForcePasswordReset) return;

          const {
            login: {
              result: { token, storefrontLoginToken },
              errors,
            },
          } = await b2bLogin({ loginData });

          storeDispatch(setB2BToken(token));
          customerLoginAPI(storefrontLoginToken);

          const loginInformation = {
            storefrontToken: storefrontLoginToken,
          };

          dispatchOnLoginEvent(loginInformation);

          if (errors?.[0] || !token) {
            if (errors?.[0]) {
              const { message } = errors[0];
              if (
                message === 'Operation cannot be performed as the storefront channel is not live'
              ) {
                setLoginFlag('accountPrelaunch');
                setLoading(false);
                return;
              }
            }
            getForcePasswordReset(data.emailAddress);
          } else {
            const info = await getCurrentCustomerInfo(token);

            if (quoteDetailToCheckoutUrl) {
              navigate(quoteDetailToCheckoutUrl);
              return;
            }

            if (
              info?.userType === String(UserTypes.MULTIPLE_B2C) &&
              info?.role === CustomerRole.SUPER_ADMIN
            ) {
              navigate('/dashboard');
              return;
            }
            const isLoginLandLocation = loginJump(navigate);

            if (!isLoginLandLocation) return;

            if (info?.userType === String(UserTypes.B2C)) {
              navigate(PATH_ROUTES.ORDERS);
            }

            const path = b2bJumpPath(Number(info?.role));

            navigate(path);
          }
        } catch (error) {
          snackbar.error(b3Lang('login.loginTipInfo.accountIncorrect'));
        } finally {
          setLoading(false);
        }
      }
    },
  );

  const handleCreateAccountSubmit = () => {
    navigate('/register');
  };

  const gotoForgotPassword = () => {
    navigate('/forgotPassword');
  };

  const loginAndRegisterContainerWidth = registerEnabled ? '100%' : '50%';
  const loginContainerWidth = registerEnabled ? '50%' : 'auto';

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
                    {tipInfo(flag, loginAccount?.emailAddress) && (
                      <Alert severity={setTipType(flag)} variant="filled">
                        {tipInfo(flag, loginAccount?.emailAddress || '')}
                      </Alert>
                    )}
                  </Box>
                )}
                {quoteDetailToCheckoutUrl && (
                  <Alert severity="error" variant="filled">
                    {b3Lang('login.loginText.quoteDetailToCheckoutUrl')}
                  </Alert>
                )}
                {loginInfo.logo && (
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
                          src={loginInfo.logo}
                          alt={b3Lang('login.registerLogo')}
                          loading="lazy"
                        />
                      </ImageListItem>
                    </LoginImage>
                  </Box>
                )}
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
                          gotoForgotPassword={gotoForgotPassword}
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
                            handleSubmit={handleCreateAccountSubmit}
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
  const platform = useAppSelector(({ global }) => global.storeInfo.platform);

  if (platform === 'catalyst') {
    return <CatalystLogin />;
  }

  return <Login {...props} />;
}
