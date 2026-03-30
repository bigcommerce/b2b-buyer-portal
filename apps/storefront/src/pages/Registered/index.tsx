import { useContext, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Box, ImageListItem } from '@mui/material';

import b2bLogo from '@/assets/b2bLogo.png';
import { B3Card } from '@/components/B3Card';
import B3Spin from '@/components/spin/B3Spin';
import { LOGIN_LANDING_LOCATIONS } from '@/constants';
import { useMobile } from '@/hooks/useMobile';
import { useScrollBar } from '@/hooks/useScrollBar';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import { bcLogin } from '@/shared/service/bc';
import { useAppSelector } from '@/store';
import b2bLogger from '@/utils/b3Logger';
import { loginJump } from '@/utils/b3Login';
import { B3SStorage } from '@/utils/b3Storage';
import { platform } from '@/utils/basicConfig';
import { getAssetUrl } from '@/utils/getAssetUrl';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';

import { loginCheckout, LoginConfig } from '../Login/helper';
import { type PageProps } from '../PageProps';

import { RegisteredContext, RegisteredProvider } from './Context';
import { RegisterSteps } from './RegisterSteps';
import { RegisteredContainer, RegisteredImage } from './styled';

function Registered(props: PageProps) {
  const { setOpenPage } = props;

  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();

  const navigate = useNavigate();

  const loginLandingLocation = useAppSelector(({ global }) => global.loginLandingLocation);
  const [params] = useSearchParams();

  const {
    state: { isCheckout, isCloseGotoBCHome, logo, registerEnabled },
  } = useContext(GlobalContext);

  const {
    state: { isLoading },
    dispatch,
  } = useContext(RegisteredContext);

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  useEffect(() => {
    if (!registerEnabled) {
      navigate('/login');
    }
  }, [navigate, registerEnabled]);

  const clearRegisterInfo = () => {
    if (dispatch) {
      dispatch({
        type: 'all',
        payload: {
          accountType: '',
          isLoading: false,
          submitSuccess: false,
          contactInformation: [],
          additionalInformation: [],
          companyExtraFields: [],
          companyInformation: [],
          companyAttachment: [],
          addressBasicFields: [],
          addressExtraFields: [],
          countryList: [],
          passwordInformation: [],
        },
      });
    }
  };

  const handleFinish = async ({ email, password }: LoginConfig) => {
    dispatch({
      type: 'loading',
      payload: {
        isLoading: true,
      },
    });

    if (isCheckout) {
      try {
        await loginCheckout({ email, password });
        window.location.reload();
      } catch (error) {
        b2bLogger.error(error);
      }
    } else {
      try {
        const customer = await bcLogin({ email, password }).then(
          (res) => res?.data?.login?.customer,
        );

        if (customer) {
          B3SStorage.set('loginCustomer', {
            emailAddress: customer.email,
            phoneNumber: customer.phone,
            ...customer,
          });
        }

        await getCurrentCustomerInfo();

        clearRegisterInfo();

        if (platform === 'catalyst') {
          const landingLoginLocation =
            params.get('redirectTo') === 'check-out'
              ? LOGIN_LANDING_LOCATIONS.CHECKOUT
              : loginLandingLocation;

          window.b2b.callbacks.dispatchEvent('on-registered', {
            email,
            password,
            landingLoginLocation,
          });

          window.location.hash = '';

          return;
        }

        const isLoginLandLocation = loginJump(navigate);

        if (!isLoginLandLocation) return;

        if (isCloseGotoBCHome) {
          window.location.href = '/';
        } else {
          navigate('/orders');
        }
      } catch (error) {
        b2bLogger.error(error);
      }
    }

    dispatch({
      type: 'loading',
      payload: {
        isLoading: false,
      },
    });
  };

  useScrollBar(false);

  return (
    <B3Card setOpenPage={setOpenPage}>
      <RegisteredContainer isMobile={isMobile}>
        <B3Spin isSpinning={isLoading} tip={b3Lang('global.tips.loading')} transparency="0">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              alignItems: 'center',
            }}
          >
            <RegisteredImage>
              <ImageListItem
                sx={{
                  maxWidth: '250px',
                }}
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                <img
                  src={logo || getAssetUrl(b2bLogo)}
                  alt={b3Lang('global.tips.registerLogo')}
                  loading="lazy"
                />
              </ImageListItem>
            </RegisteredImage>
            <RegisterSteps backgroundColor={backgroundColor} handleFinish={handleFinish} />
          </Box>
        </B3Spin>
      </RegisteredContainer>
    </B3Card>
  );
}

export default function RegisterPage(props: PageProps) {
  return (
    <RegisteredProvider>
      <Registered {...props} />
    </RegisteredProvider>
  );
}
