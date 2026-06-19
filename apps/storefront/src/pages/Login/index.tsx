import { useContext, useEffect, useRef, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Alert, Box } from '@mui/material';

import { B3Card } from '@/components/B3Card';
import B3Spin from '@/components/spin/B3Spin';
import { CHECKOUT_URL } from '@/constants';
import { dispatchEvent } from '@/hooks/useB2BCallback';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import { getB2BToken, getBCForcePasswordReset } from '@/shared/service/b2b';
import { bcLogin, customerLoginAPI, getCurrentCustomerJWT } from '@/shared/service/bc';
import { getAppClientId } from '@/shared/service/request/base';
import { isLoggedInSelector, useAppDispatch, useAppSelector } from '@/store';
import { setB2BToken, setCurrentCustomerJWT } from '@/store/slices/company';
import { LoginFlagType } from '@/types/login';
import b2bLogger from '@/utils/b3Logger';
import { snackbar } from '@/utils/b3Tip';
import { channelId, platform } from '@/utils/basicConfig';
import { isCompanyError } from '@/utils/companyUtils';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';
import { isDefaultLoginStylingActive } from '@/utils/preMountLoginMask';

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

  const useBcLoginAndAuthorisation = useFeatureFlag('PROJECT-7920.use_bc_login_and_authorisation');

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
    state: { isCheckout, registerEnabled, isLogoLoaded },
  } = useContext(GlobalContext);

  // Read the feature signal synchronously (not from Redux), since the Redux flag
  // is still false on the first render — before getStoreConfigs resolves — which
  // would let the form render with hardcoded defaults and then flicker as the
  // real config swaps in. isDefaultLoginStylingActive() mirrors the pre-mount
  // mask's optimistic gate, so the in-iframe content and the mask stay in step.
  const [isDefaultLoginStyling] = useState(isDefaultLoginStylingActive);
  const isPageComplete = useAppSelector(({ global }) => global.isPageComplete);

  // When the default-login-styling feature is on, hold the form back until the
  // merchant login config has loaded (isLogoLoaded) to avoid a flicker as the
  // hardcoded context defaults are swapped for the real config. We also reveal
  // the form once app init has finished (isPageComplete) so that a failed
  // getStoreConfigs — which leaves isLogoLoaded false — doesn't strand the user
  // on an endless spinner with no sign-in form. When the feature is off we keep
  // the previous behaviour of rendering the form immediately.
  const isLoginConfigReady = !isDefaultLoginStyling || isLogoLoaded || isPageComplete;

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

  const fetchCurrentCustomerJWT = async (): Promise<string | undefined> => {
    const currentCustomerJWT = await getCurrentCustomerJWT(getAppClientId()).catch((error) => {
      b2bLogger.error(error);
      return undefined;
    });

    if (currentCustomerJWT) {
      storeDispatch(setCurrentCustomerJWT(currentCustomerJWT));
    }

    return currentCustomerJWT;
  };

  const fetchB2BToken = async (
    currentCustomerJWT: string | undefined,
    email: string,
  ): Promise<string | undefined> => {
    if (!currentCustomerJWT) {
      b2bLogger.error('B2B token error:', 'Missing customer JWT');
      setLoginFlag('accountIncorrect');
      return undefined;
    }

    // Don't catch getB2BToken errors here — let them propagate to
    // handleRegularLogin's catch, which distinguishes CompanyError (pending /
    // inactive accounts → snackbar + logout) and the prelaunch error
    // (→ accountPrelaunch). Swallowing them would mis-report every failure as
    // "incorrect credentials".
    const data = await getB2BToken(currentCustomerJWT, channelId);
    const B2BToken = data.authorization.result.token as string;

    if (!B2BToken) {
      b2bLogger.error('No B2B token returned from auth mutation');
      const needsReset = await getBCForcePasswordReset(email);
      setLoginFlag(needsReset ? 'resetPassword' : 'accountIncorrect');
      return undefined;
    }

    return B2BToken;
  };
  /*
   * handleRegularLogin flow
   *
   * Step 1: On page load, no BC auth token exists — it is fetched automatically.
   * Step 2: Run the BC login mutation (bcLogin).
   * (when useBcLoginAndAuthorisation = true)
   * If the Step 2 fails, the flow stops here.
   * Step 3: Retrieve the current customer JWT (fetchCurrentCustomerJWT).
   * Step 4: Call fetchB2BToken, which performs the Authorization mutation and returns the B2B token
   */
  const handleRegularLogin = async (data: LoginConfig) => {
    try {
      const { errors: bcErrors } = await bcLogin({ email: data.email, password: data.password });

      if (bcErrors?.[0]?.message === 'Reset password') {
        const needsReset = await getBCForcePasswordReset(data.email);
        setLoginFlag(needsReset ? 'resetPassword' : 'accountIncorrect');
        return;
      }

      if (useBcLoginAndAuthorisation) {
        // Any other BC login error (e.g. "Invalid credentials") means the login
        // failed — stop here and surface the error without making any further
        // API calls. BC returns these with HTTP 200 in the GraphQL `errors`
        // array, so we have to inspect `errors` rather than rely on a throw.
        if (bcErrors?.[0]) {
          b2bLogger.error('BC login error:', bcErrors[0]?.message);
          setLoginFlag('accountIncorrect');
          return;
        }

        const currentCustomerJWT = await fetchCurrentCustomerJWT();
        const B2BToken = await fetchB2BToken(currentCustomerJWT, data.email);
        if (!B2BToken) {
          return;
        }
        storeDispatch(setB2BToken(B2BToken));
        const info = await getCurrentCustomerInfo(B2BToken);
        navigateAfterSuccessfulLogin(navigate, info, quoteDetailToCheckoutUrl);
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
      } else if (
        useBcLoginAndAuthorisation &&
        error instanceof Error &&
        error.message === 'Operation cannot be performed as the storefront channel is not live'
      ) {
        setLoginFlag('accountPrelaunch');
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
        <B3Spin
          isSpinning={isLoading || !isLoginConfigReady}
          tip={b3Lang('global.tips.loading')}
          background="transparent"
        >
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
            {/*
              Wait for the merchant login config (logo, button text, HTML regions, create
              account panel) to load before rendering the form. The contexts hold hardcoded
              defaults until getStoreConfigs() resolves, and rendering them first causes a
              flicker as the real config swaps in. isLogoLoaded flips true in the same dispatch
              that merges the CustomStyleContext config, so it gates the whole login config.
              This gating only applies when the default-login-styling feature flag is on; see
              isLoginConfigReady for the flag/fallback behaviour.
            */}
            {isLoginConfigReady && (
              <>
                <LoginTip showTipInfo={showTipInfo} flag={flag} loginAccount={loginAccount} />
                {quoteDetailToCheckoutUrl && (
                  <Alert severity="error" variant="filled">
                    {b3Lang('login.loginText.quoteDetailToCheckoutUrl')}
                  </Alert>
                )}
                <Box sx={{ margin: '20px 0', minHeight: '150px' }}>
                  {isLogoLoaded && loginInfo.logo && (
                    <LoginImage
                      maxWidth={isMobile ? '70%' : '250px'}
                      src={loginInfo.logo}
                      alt={b3Lang('login.registerLogo')}
                      onClick={() => {
                        window.location.href = '/';
                      }}
                    />
                  )}
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
