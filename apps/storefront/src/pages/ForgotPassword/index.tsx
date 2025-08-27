import { useB3Lang } from '@b3/lang';
import { Box, ImageListItem, Typography } from '@mui/material';
import { useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';

import { B3Card, B3CustomForm } from '@/components';
import CustomButton from '@/components/button/CustomButton';
import { Captcha } from '@/components/form';
import B3Spin from '@/components/spin/B3Spin';
import { useMobile } from '@/hooks';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import { getStorefrontToken, requestResetPassword } from '@/shared/service/b2b/graphql/recaptcha';
import b2bLogger from '@/utils/b3Logger';

import { getForgotPasswordFields, sendForgotPasswordEmailFor } from '../Login/config';
import { B3ResetPassWordButton, LoginImage } from '../Login/styled';
import { type PageProps } from '../PageProps';

interface ForgotPasswordProps extends PageProps {
  logo?: string;
  isEnabledOnStorefront: boolean;
  storefrontSiteKey: string;
}

interface FormFields {
  email: string;
}

export function ForgotPassword({
  setOpenPage,
  isEnabledOnStorefront,
  storefrontSiteKey,
  logo,
}: ForgotPasswordProps) {
  const [isMobile] = useMobile();
  const [isLoading, setLoading] = useState<boolean>(false);
  const b3Lang = useB3Lang();
  const forgotPasswordFields = getForgotPasswordFields(b3Lang);
  const [isCaptchaMissing, setIsCaptchaMissing] = useState(false);
  const [captchaKey, setCaptchaKey] = useState('');

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
  } = useForm<FormFields>({
    mode: 'onSubmit',
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (captchaKey || !isEnabledOnStorefront) setIsCaptchaMissing(false);
  }, [captchaKey, isEnabledOnStorefront]);

  const handleLoginClick = handleSubmit(async ({ email }) => {
    if (isEnabledOnStorefront && !captchaKey) {
      setIsCaptchaMissing(true);

      return;
    }

    try {
      setLoading(true);

      if (isEnabledOnStorefront && captchaKey) {
        try {
          await requestResetPassword(captchaKey, email);
          navigate('/login?loginFlag=receivePassword');
          setLoading(false);
        } catch (e) {
          b2bLogger.error(e);
        }
      }

      if (!isEnabledOnStorefront) {
        await sendForgotPasswordEmailFor(email);
        setLoading(false);
        navigate('/login?loginFlag=receivePassword');
      }
    } catch (e) {
      b2bLogger.error(e);
    }
  });

  return (
    <B3Card setOpenPage={setOpenPage}>
      <Box
        sx={{
          bgcolor: '#FFFFFF',
          borderRadius: '4px',
          display: 'flex',
          flexDirection: 'column',
          mr: 'auto',
          ml: 'auto',
          maxWidth: '537px',
        }}
      >
        <Box sx={{ mt: '20px' }}>
          {logo && (
            <LoginImage>
              <ImageListItem
                onClick={() => {
                  window.location.assign('/');
                }}
                sx={{
                  maxWidth: isMobile ? '175px' : '250px',
                }}
              >
                <img alt={b3Lang('global.tips.registerLogo')} loading="lazy" src={logo} />
              </ImageListItem>
            </LoginImage>
          )}
        </Box>
        <Box
          sx={{
            margin: '20px 0 0 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            sx={{
              margin: '16px 0',
            }}
            variant="h5"
          >
            {b3Lang('forgotPassword.resetPassword')}
          </Typography>
          <Typography
            sx={{
              margin: '0 16px 16px 16px',
            }}
            variant="body1"
          >
            {b3Lang('forgotPassword.requestEmail')}
          </Typography>
          <B3CustomForm
            control={control}
            errors={errors}
            formFields={forgotPasswordFields}
            getValues={getValues}
            setValue={setValue}
            sx={{ margin: '0 16px', maxWidth: isMobile ? '311px' : '505px' }}
          />
          {isEnabledOnStorefront && isCaptchaMissing ? (
            <Typography
              sx={{
                color: 'red',
                display: 'flex',
                alignSelf: 'flex-start',
                marginLeft: '18px',
                marginTop: '2px',
                fontSize: '13px',
              }}
              variant="body1"
            >
              {b3Lang('login.loginText.missingCaptcha')}
            </Typography>
          ) : (
            ''
          )}
          {isEnabledOnStorefront ? (
            <Box sx={{ marginTop: '20px' }}>
              <Captcha handleGetKey={setCaptchaKey} siteKey={storefrontSiteKey} size="normal" />
            </Box>
          ) : (
            ''
          )}
          <B3Spin isFlex={false} isSpinning={isLoading} size={20}>
            <B3ResetPassWordButton>
              <CustomButton
                onClick={handleLoginClick}
                size="medium"
                sx={{ width: 'auto' }}
                type="submit"
                variant="contained"
              >
                {b3Lang('forgotPassword.resetPasswordBtn')}
              </CustomButton>
            </B3ResetPassWordButton>
          </B3Spin>
        </Box>
      </Box>
    </B3Card>
  );
}

export default function Page({ setOpenPage }: PageProps) {
  const { logo } = useContext(GlobalContext).state;
  const { loginPageDisplay } = useContext(CustomStyleContext).state;
  const [isEnabledOnStorefront, setIsEnabledOnStorefront] = useState(false);
  const [storefrontSiteKey, setStorefrontSiteKey] = useState('');

  useEffect(() => {
    const getIsEnabledOnStorefront = async () => {
      try {
        const response = await getStorefrontToken();

        if (response) {
          setIsEnabledOnStorefront(response.isEnabledOnStorefront);
          setStorefrontSiteKey(response.siteKey);
        }
      } catch (e) {
        b2bLogger.error(e);
      }
    };

    getIsEnabledOnStorefront();
  }, []);

  return (
    <ForgotPassword
      isEnabledOnStorefront={isEnabledOnStorefront}
      logo={loginPageDisplay.displayStoreLogo ? logo : undefined}
      setOpenPage={setOpenPage}
      storefrontSiteKey={storefrontSiteKey}
    />
  );
}
