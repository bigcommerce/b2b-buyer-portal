import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box } from '@mui/material';

import b2bLogo from '@/assets/b2bLogo.png';
import { B3Card } from '@/components/B3Card';
import B3Spin from '@/components/spin/B3Spin';
import { CHECKOUT_URL } from '@/constants';
import { dispatchEvent } from '@/hooks/useB2BCallback';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import { getBCForcePasswordReset } from '@/shared/service/b2b';
import { bcLogin, customerLoginAPI } from '@/shared/service/bc';
import { isLoggedInSelector, useAppDispatch, useAppSelector } from '@/store';
import { setB2BToken } from '@/store/slices/company';
import { LoginFlagType } from '@/types/login';
import b2bLogger from '@/utils/b3Logger';
import { snackbar } from '@/utils/b3Tip';
import { platform } from '@/utils/basicConfig';
import { isCompanyError } from '@/utils/companyUtils';
import { getAssetUrl } from '@/utils/getAssetUrl';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';

import { type PageProps } from '../PageProps';

import LoginWidget from './component/LoginWidget';
import { CatalystLogin } from './CatalystLogin';
import {
  COMPANY_STATUS_MAPPINGS,
  isLoginFlagType,
  LoginConfig,
  SHOULD_LOGOUT_FLAGS,
} from './helper';
import LoginForm from './LoginForm';
import LoginImage from './LoginImage';
import LoginPanel from './LoginPanel';
import LoginTip from './LoginTip';
import { navigateAfterSuccessfulLogin } from './navigateAfterSuccessfulLogin';
import { performB2BLogin } from './performB2BLogin';
import { performLoginCheckout } from './performLoginCheckout';
import { LoginContainer } from './styled';
import { useLoginInfo } from './useLoginInfo';
import { useLogout } from './useLogout';

function Login(props: PageProps) {
  const { setOpenPage } = props;
  const storeDispatch = useAppDispatch();
  const logout = useLogout();

  const isLoggedIn = useAppSelector(isLoggedInSelector);

  const quoteDetailToCheckoutUrl = useAppSelector(
    ({ quoteInfo }) => quoteInfo.quoteDetailToCheckoutUrl,
  );

  const [isLoading, setLoading] = useState(true);
  const isSubmittingRef = useRef(false);
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
    state: { isCheckout, registerEnabled },
  } = useContext(GlobalContext);

  const {
    state: {
      portalStyle: { backgroundColor = 'FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const loginInfo = useLoginInfo();

  useEffect(() => {
    (async () => {
      try {
        const showTipInfo = searchParams.get('showTip') !== 'false';
        setShowTipInfo(showTipInfo);

        const loginFlag = searchParams.get('loginFlag');
        if (isLoginFlagType(loginFlag)) {
          setLoginFlag(loginFlag);

          if (isLoggedIn && loginFlag === 'loggedOutLogin') {
            await logout({ showLogoutBanner: true });
            // All company-related flags have isLoggedIn set to false.
          } else if (!isLoggedIn && SHOULD_LOGOUT_FLAGS.includes(loginFlag)) {
            await logout({ showLogoutBanner: false });
          }
        }

        if (!isSubmittingRef.current) setLoading(false);
      } finally {
        if (!isSubmittingRef.current) setLoading(false);
      }
    })();
  }, [b3Lang, isLoggedIn, logout, searchParams]);

  const handleRegularLogin = async (data: LoginConfig) => {
    try {
      const { errors: bcErrors } = await bcLogin({ email: data.email, password: data.password });
      if (bcErrors?.[0]?.message === 'Reset password') {
        const needsReset = await getBCForcePasswordReset(data.email);
        setLoginFlag(needsReset ? 'resetPassword' : 'accountIncorrect');
        return;
      }

      const { token, storefrontLoginToken, errors } = await performB2BLogin(data);

      storeDispatch(setB2BToken(token));
      customerLoginAPI(storefrontLoginToken);
      dispatchEvent('on-login', { storefrontToken: storefrontLoginToken });

      if (
        errors?.[0]?.message ===
        'Operation cannot be performed as the storefront channel is not live'
      ) {
        setLoginFlag('accountPrelaunch');
        return;
      }

      if (errors?.[0] || !token) {
        const needsReset = await getBCForcePasswordReset(data.email);
        setLoginFlag(needsReset ? 'resetPassword' : 'accountIncorrect');
        return;
      }

      const info = await getCurrentCustomerInfo(token);
      navigateAfterSuccessfulLogin(navigate, info, quoteDetailToCheckoutUrl);
    } catch (error: unknown) {
      if (isCompanyError(error)) {
        snackbar.error(b3Lang(COMPANY_STATUS_MAPPINGS[error.reason]));
        await logout({ showLogoutBanner: false });
      } else if (error instanceof Error) {
        snackbar.error(b3Lang('login.loginTipInfo.accountIncorrect'));
      }
    }
  };

  const handleLoginCheckout = async (data: LoginConfig) => {
    try {
      const result = await performLoginCheckout(data);
      if (result === 'success') {
        window.location.href = CHECKOUT_URL;
      } else {
        setLoginFlag(result);
      }
    } catch (error) {
      b2bLogger.error(error);
      const needsReset = await getBCForcePasswordReset(data.email);
      setLoginFlag(needsReset ? 'resetPassword' : 'accountIncorrect');
    }
  };

  const handleLoginSubmit = async (data: LoginConfig) => {
    if (isSubmittingRef.current) return;
    isSubmittingRef.current = true;
    setLoading(true);
    setLoginAccount(data);
    setSearchParams((prevURLSearchParams) => {
      prevURLSearchParams.delete('loginFlag');
      return prevURLSearchParams;
    });
    try {
      if (isCheckout) {
        await handleLoginCheckout(data);
      } else {
        await handleRegularLogin(data);
      }
    } finally {
      isSubmittingRef.current = false;
      setLoading(false);
    }
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
              alignItems: !registerEnabled && !isMobile ? 'center' : 'stretch',
              width: '100%',
              minHeight: '400px',
              minWidth: '343px',
            }}
          >
            <LoginTip showTipInfo={showTipInfo} flag={flag} loginAccount={loginAccount} />
            {quoteDetailToCheckoutUrl && (
              <Alert severity="error" variant="filled">
                {b3Lang('login.loginText.quoteDetailToCheckoutUrl')}
              </Alert>
            )}
            <Box sx={{ margin: '20px 0', minHeight: '150px' }}>
              <LoginImage
                maxWidth={isMobile ? '70%' : '250px'}
                src={loginInfo.logo || getAssetUrl(b2bLogo)}
                alt={b3Lang('login.registerLogo')}
                onClick={() => {
                  window.location.href = '/';
                }}
              />
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
                backgroundColor: '#FFFFFF',
                borderRadius: '4px',
                margin: '20px 0',
                display: 'flex',
                flexDirection: isMobile ? 'column' : 'row',
                justifyContent: 'center',
                width: isMobile ? 'auto' : loginAndRegisterContainerWidth,
              }}
            >
              <Box
                sx={{
                  width: isMobile ? 'auto' : loginContainerWidth,
                  paddingRight: isMobile ? 0 : '2%',
                  ml: '16px',
                  mr: isMobile ? '16px' : undefined,
                  pb: registerEnabled ? undefined : '36px',
                }}
              >
                <LoginForm
                  loginBtn={loginInfo.loginBtn}
                  handleLoginSubmit={handleLoginSubmit}
                  backgroundColor={backgroundColor}
                  isLoading={isLoading}
                />
              </Box>

              {registerEnabled && (
                <Box
                  sx={{
                    flex: '1',
                    paddingLeft: isMobile ? 0 : '2%',
                    mb: '20px',
                  }}
                >
                  <LoginPanel
                    createAccountButtonText={loginInfo.createAccountButtonText}
                    widgetBodyText={loginInfo.widgetBodyText}
                  />
                </Box>
              )}
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
