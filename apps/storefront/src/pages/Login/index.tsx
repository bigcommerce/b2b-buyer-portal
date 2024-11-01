import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { B2BEvent, useB2BCallback } from '@b3/hooks';
import { useB3Lang } from '@b3/lang';
import { Alert, Box, ImageListItem } from '@mui/material';

import { B3Card } from '@/components';
import B3Spin from '@/components/spin/B3Spin';
import { CHECKOUT_URL } from '@/constants';
import { useMobile } from '@/hooks';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { defaultCreateAccountPanel } from '@/shared/customStyleButton/context/config';
import { GlobaledContext } from '@/shared/global';
import { getBCForcePasswordReset, superAdminEndMasquerade } from '@/shared/service/b2b';
import { b2bLogin, bcLogoutLogin, customerLoginAPI } from '@/shared/service/bc';
import { deleteCart, getCart } from '@/shared/service/bc/graphql/cart';
import {
  clearMasqueradeCompany,
  isLoggedInSelector,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { setB2BToken } from '@/store/slices/company';
import { CustomerRole, UserTypes } from '@/types';
import { channelId, getB3PermissionsList, loginJump, snackbar, storeHash } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import { logoutSession } from '@/utils/b3logout';
import { deleteCartData } from '@/utils/cartUtils';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';

import { type PageProps } from '../PageProps';

import LoginWidget from './component/LoginWidget';
import { loginCheckout, LoginConfig } from './config';
import LoginForm from './LoginForm';
import LoginPanel from './LoginPanel';
import { LoginContainer, LoginImage } from './styled';

type AlertColor = 'success' | 'info' | 'warning' | 'error';

const useMasquerade = () => {
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const b2bId = useAppSelector(({ company }) => company.customer.b2bId);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const storeDispatch = useAppDispatch();

  const isMasquerade = isAgenting && typeof b2bId === 'number';

  const endMasquerade = useCallback(async () => {
    if (isMasquerade) {
      await superAdminEndMasquerade(+salesRepCompanyId, b2bId);
      storeDispatch(clearMasqueradeCompany());
    }
  }, [b2bId, isMasquerade, salesRepCompanyId, storeDispatch]);

  return { endMasquerade, isMasquerade };
};

const setTipType = (flag: string): AlertColor | undefined => {
  if (!flag) {
    return undefined;
  }

  switch (flag) {
    case '1':
      return 'error';
    case '4':
      return 'error';
    case '5':
      return 'warning';
    default:
      return 'success';
  }
};

export default function Login(props: PageProps) {
  const { isMasquerade, endMasquerade } = useMasquerade();
  const { setOpenPage } = props;
  const storeDispatch = useAppDispatch();

  const isLoggedIn = useAppSelector(isLoggedInSelector);

  const quoteDetailToCheckoutUrl = useAppSelector(
    ({ quoteInfo }) => quoteInfo.quoteDetailToCheckoutUrl,
  );

  const [isLoading, setLoading] = useState(true);
  const [isMobile] = useMobile();

  const [showTipInfo, setShowTipInfo] = useState<boolean>(true);
  const [flag, setLoginFlag] = useState<string>('');
  const [loginAccount, setLoginAccount] = useState<LoginConfig>({
    emailAddress: '',
    password: '',
  });
  const navigate = useNavigate();
  const b3Lang = useB3Lang();
  const [searchParams, setSearchParams] = useSearchParams();

  const {
    state: { isCheckout, logo, registerEnabled },
  } = useContext(GlobaledContext);

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

  const logoutEffect = useB2BCallback(B2BEvent.OnLogout, async (dispatchLogoutEvent) => {
    try {
      const loginFlag = searchParams.get('loginFlag');
      const showTipInfo = searchParams.get('showTip') !== 'false';

      setShowTipInfo(showTipInfo);

      if (loginFlag) setLoginFlag(loginFlag);

      if (loginFlag === '7') {
        snackbar.error(b3Lang('login.loginText.invoiceErrorTip'));
      }
      if (loginFlag === '3' && isLoggedIn) {
        const cartInfo = await getCart();

        if (cartInfo.data.site.cart?.entityId) {
          const deleteQuery = deleteCartData(cartInfo.data.site.cart.entityId);
          await deleteCart(deleteQuery);
        }

        const { result } = (await bcLogoutLogin()).data.logout;

        if (result !== 'success') return;

        if (isMasquerade) {
          await endMasquerade();
        }

        // SUP-1282 Clear sessionStorage to allow visitors to display the checkout page
        window.sessionStorage.clear();

        logoutSession();
        setLoading(false);
        return;
      }

      setLoading(false);
    } finally {
      setLoading(false);
      dispatchLogoutEvent();
    }
  });

  useEffect(() => {
    logoutEffect();
  }, [logoutEffect]);

  const tipInfo = (loginFlag: string, email = '') => {
    if (!loginFlag) {
      return '';
    }

    switch (loginFlag) {
      case '1':
        return b3Lang('login.loginTipInfo.resetPassword', {
          email,
        });
      case '2':
        return b3Lang('login.loginTipInfo.receivePassword');
      case '3':
        return b3Lang('login.loginTipInfo.loggedOutLogin');
      case '4':
        return b3Lang('login.loginTipInfo.accountincorrect');
      case '5':
        return b3Lang('login.loginTipInfo.accountPrelaunch');
      case '6':
        return b3Lang('login.loginText.deviceCrowdingLogIn');
      default:
        return '';
    }
  };

  const getForcePasswordReset = async (email: string) => {
    const forcePasswordReset = await getBCForcePasswordReset(email);

    if (forcePasswordReset) {
      setLoginFlag('1');
    } else {
      setLoginFlag('4');
    }
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
          await loginCheckout(data);
          window.location.href = CHECKOUT_URL;
        } catch (error) {
          b2bLogger.error(error);
          getForcePasswordReset(data.emailAddress);
        }
      } else {
        try {
          const loginData = {
            email: data.emailAddress,
            password: data.password,
            storeHash,
            channelId,
          };
          const {
            login: {
              result: { token, storefrontLoginToken },
              errors,
            },
          } = await b2bLogin({ loginData });

          storeDispatch(setB2BToken(token));
          customerLoginAPI(storefrontLoginToken);

          dispatchOnLoginEvent(storefrontLoginToken);

          if (errors?.[0] || !token) {
            if (errors?.[0]) {
              const { message } = errors[0];
              if (
                message === 'Operation cannot be performed as the storefront channel is not live'
              ) {
                setLoginFlag('5');
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
              info?.userType === UserTypes.MULTIPLE_B2C &&
              info?.role === CustomerRole.SUPER_ADMIN
            ) {
              navigate('/dashboard');
              return;
            }
            const isLoginLandLocation = loginJump(navigate);

            if (!isLoginLandLocation) return;

            const { getShoppingListPermission, getOrderPermission } = getB3PermissionsList();
            if (
              info?.role === CustomerRole.JUNIOR_BUYER &&
              info?.companyRoleName === 'Junior Buyer'
            ) {
              const currentJuniorActivePage = getShoppingListPermission
                ? '/shoppingLists'
                : '/accountSettings';

              navigate(currentJuniorActivePage);
            } else {
              let currentActivePage = getOrderPermission ? '/orders' : '/shoppingLists';

              currentActivePage =
                getShoppingListPermission || getOrderPermission
                  ? currentActivePage
                  : '/accountSettings';

              currentActivePage = info?.userType === UserTypes.B2C ? '/orders' : currentActivePage;
              navigate(currentActivePage);
            }
          }
        } catch (error) {
          snackbar.error(b3Lang('login.loginTipInfo.accountincorrect'));
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
    navigate('/forgotpassword');
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
