import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { Alert, Box, ImageListItem } from '@mui/material';

import { B3Card } from '@/components';
import B3Spin from '@/components/spin/B3Spin';
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
  setPermissionModules,
  store,
  useAppDispatch,
  useAppSelector,
} from '@/store';
import { setB2BToken } from '@/store/slices/company';
import { CustomerRole, UserTypes } from '@/types';
import { OpenPageState } from '@/types/hooks';
import { channelId, loginjump, snackbar, storeHash } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import { logoutSession } from '@/utils/b3logout';
import { deleteCartData } from '@/utils/cartUtils';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';

import LoginWidget from './component/LoginWidget';
import { loginCheckout, LoginConfig, LoginInfoInit } from './config';
import LoginForm from './LoginForm';
import LoginPanel from './LoginPanel';
import { LoginContainer, LoginImage } from './styled';

const initialLoginInfo = {
  loginTitle: 'Sign In',
  isShowWidgetHead: false,
  isShowWidgetBody: false,
  isShowWidgetFooter: false,
  loginBtn: 'Sign in',
  createAccountPanelTittle: 'Create Account Panel Title',
  CreateAccountButtonText: 'Create Account',
  btnColor: 'red',
  widgetHeadText: '',
  widgetBodyText: '',
  widgetFooterText: '',
  displayStoreLogo: false,
};
interface RegisteredProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>;
}

type AlertColor = 'success' | 'info' | 'warning' | 'error';

export default function Login(props: RegisteredProps) {
  const { setOpenPage } = props;
  const storeDispatch = useAppDispatch();

  const isLoggedIn = useAppSelector(isLoggedInSelector);
  const b2bId = useAppSelector(({ company }) => company.customer.b2bId);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const quoteDetailToCheckoutUrl = useAppSelector(
    ({ quoteInfo }) => quoteInfo.quoteDetailToCheckoutUrl,
  );

  const [isLoading, setLoading] = useState(true);
  const [isMobile] = useMobile();

  const [showTipInfo, setShowTipInfo] = useState<boolean>(true);
  const [flag, setLoginFlag] = useState<string>('');
  const [loginInfo, setLoginInfo] = useState<LoginInfoInit | null>(null);
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

  useEffect(() => {
    const init = async () => {
      try {
        const { createAccountButtonText, primaryButtonColor, signInButtonText } = loginPageButton;
        const { displayStoreLogo, pageTitle } = loginPageDisplay;

        const {
          bottomHtmlRegionEnabled,
          bottomHtmlRegionHtml,
          createAccountPanelHtml,
          topHtmlRegionEnabled,
          topHtmlRegionHtml,
        } = loginPageHtml;

        const Info = {
          loginTitle: pageTitle || b3Lang('login.button.signIn'),
          loginBtn: signInButtonText || b3Lang('login.button.signInUppercase'),
          CreateAccountButtonText: createAccountButtonText || b3Lang('login.button.createAccount'),
          btnColor: primaryButtonColor || '',
          isShowWidgetHead: topHtmlRegionEnabled || false,
          widgetHeadText: topHtmlRegionHtml || '',
          widgetBodyText: createAccountPanelHtml || defaultCreateAccountPanel,
          isShowWidgetFooter: bottomHtmlRegionEnabled || false,
          widgetFooterText: bottomHtmlRegionHtml || '',
          displayStoreLogo: displayStoreLogo || false,
        };

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

          if (isAgenting && typeof b2bId === 'number') {
            await superAdminEndMasquerade(+salesRepCompanyId, b2bId);
            storeDispatch(clearMasqueradeCompany());
          }

          // SUP-1282 Clear sessionStorage to allow visitors to display the checkout page
          window.sessionStorage.clear();

          logoutSession();
          setLoading(false);
          window.location.reload();
          return;
        }

        setLoginInfo(Info);
        setLoading(false);
      } catch (e) {
        setLoginInfo(initialLoginInfo);
      } finally {
        setLoading(false);
      }
    };

    init();
    // disabling as we only need to run this on the first render and its causing infinite loops when loging in
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const tipInfo = (loginFlag: string, email = '') => {
    let str = '';
    if (loginFlag) {
      switch (loginFlag) {
        case '1':
          str = b3Lang('login.loginTipInfo.resetPassword', {
            email,
          });
          break;
        case '2':
          str = b3Lang('login.loginTipInfo.receivePassword');
          break;
        case '3':
          str = b3Lang('login.loginTipInfo.loggedOutLogin');
          break;
        case '4':
          str = b3Lang('login.loginTipInfo.accountincorrect');
          break;
        case '5':
          str = b3Lang('login.loginTipInfo.accountPrelaunch');
          break;
        case '6':
          str = b3Lang('login.loginText.deviceCrowdingLogIn');
          break;
        default:
          str = '';
      }
    }
    return str;
  };

  const setTipType = (flag: string): AlertColor | undefined => {
    if (!flag) return undefined;
    let tipType: AlertColor = 'success';
    switch (flag) {
      case '1':
        tipType = 'error';
        break;
      case '4':
        tipType = 'error';
        break;
      case '5':
        tipType = 'warning';
        break;
      default:
        tipType = 'success';
    }
    return tipType;
  };

  const getforcePasswordReset = async (email: string) => {
    const {
      companyUserInfo: {
        userInfo: { forcePasswordReset },
      },
    } = await getBCForcePasswordReset(email);

    if (forcePasswordReset) {
      setLoginFlag('1');
    } else {
      setLoginFlag('4');
    }
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
        await loginCheckout(data);
        window.location.reload();
      } catch (error) {
        b2bLogger.error(error);
        getforcePasswordReset(data.emailAddress);
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
            result: { token, storefrontLoginToken, permissions },
            errors,
          },
        } = await b2bLogin({ loginData });

        storeDispatch(setB2BToken(token));
        store.dispatch(setPermissionModules(permissions));
        customerLoginAPI(storefrontLoginToken);

        if (errors?.[0] || !token) {
          if (errors?.[0]) {
            const { message } = errors[0];
            if (message === 'Operation cannot be performed as the storefront channel is not live') {
              setLoginFlag('5');
              setLoading(false);
              return;
            }
          }
          getforcePasswordReset(data.emailAddress);
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
          const isLoginLandLocation = loginjump(navigate);

          if (!isLoginLandLocation) return;

          if (info?.role === CustomerRole.JUNIOR_BUYER) {
            navigate('/shoppingLists');
          } else {
            navigate('/orders');
          }
        }
      } catch (error) {
        snackbar.error(b3Lang('login.loginTipInfo.accountincorrect'));
      } finally {
        setLoading(false);
      }
    }
  };

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
                {logo && loginInfo?.displayStoreLogo && (
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
                        <img src={`${logo}`} alt={b3Lang('login.registerLogo')} loading="lazy" />
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
                    isVisible={loginInfo.isShowWidgetHead}
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
                          loginInfo={loginInfo}
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
                            loginInfo={loginInfo}
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
                    isVisible={loginInfo.isShowWidgetFooter}
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
