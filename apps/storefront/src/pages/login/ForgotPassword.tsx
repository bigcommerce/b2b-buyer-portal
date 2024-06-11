import { Dispatch, SetStateAction, useContext, useEffect, useState } from 'react';
import { SubmitHandler, useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { Box, ImageListItem, Typography } from '@mui/material';

import { B3Card, B3CustomForm } from '@/components';
import CustomButton from '@/components/button/CustomButton';
import { Captcha } from '@/components/form';
import B3Sping from '@/components/spin/B3Sping';
import { useMobile } from '@/hooks';
import { CustomStyleContext } from '@/shared/customStyleButton/context';
import { GlobaledContext } from '@/shared/global';
import { getStorefrontToken, requestResetPassword } from '@/shared/service/b2b/graphql/recaptcha';
import { OpenPageState } from '@/types/hooks';
import b2bLogger from '@/utils/b3Logger';

import { getForgotPasswordFields, LoginConfig, sendEmail } from './config';
import { B3ResetPassWordButton, LoginImage } from './styled';

interface ForgotPasswordProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>;
}

function ForgotPassword(props: ForgotPasswordProps) {
  const {
    state: { logo },
  } = useContext(GlobaledContext);

  const {
    state: {
      loginPageDisplay: { displayStoreLogo },
    },
  } = useContext(CustomStyleContext);

  const [isMobile] = useMobile();
  const [isLoading, setLoading] = useState<boolean>(false);
  const b3Lang = useB3Lang();
  const forgotPasswordFields = getForgotPasswordFields(b3Lang);
  const [isEnabledOnStorefront, setIsEnabledOnStorefront] = useState(false);
  const [storefrontSiteKey, setStorefrontSiteKey] = useState('');
  const [isCaptchaMissing, setIsCaptchaMissing] = useState(false);
  const [captchaKey, setCaptchaKey] = useState('');

  const handleGetCaptchaKey = (key: string) => setCaptchaKey(key);

  const { setOpenPage } = props;

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
    watch,
  } = useForm<LoginConfig>({
    mode: 'onSubmit',
  });

  const navigate = useNavigate();
  const emailAddressReset = watch('emailAddress');

  useEffect(() => {
    const getIsEnabledOnStorefront = async () => {
      try {
        const response = await getStorefrontToken();

        if (response.data) {
          setIsEnabledOnStorefront(response.data.site.settings.reCaptcha.isEnabledOnStorefront);
          setStorefrontSiteKey(response.data.site.settings.reCaptcha.siteKey);
        }
      } catch (e) {
        b2bLogger.error(e);
      }
    };

    getIsEnabledOnStorefront();
  }, []);

  useEffect(() => {
    if (captchaKey || !isEnabledOnStorefront) setIsCaptchaMissing(false);
  }, [captchaKey, isEnabledOnStorefront]);

  const handleLoginClick: SubmitHandler<LoginConfig> = async (data) => {
    const { emailAddress } = data;

    if (isEnabledOnStorefront && !captchaKey) {
      setIsCaptchaMissing(true);
      return;
    }

    try {
      setLoading(true);
      if (isEnabledOnStorefront && captchaKey) {
        try {
          await requestResetPassword(captchaKey, emailAddressReset);
          navigate('/login?loginFlag=2');
          setLoading(false);
        } catch (e) {
          b2bLogger.error(e);
        }
      }

      if (!isEnabledOnStorefront) {
        await sendEmail(emailAddress);
        setLoading(false);
        navigate('/login?loginFlag=2');
      }
    } catch (e) {
      b2bLogger.error(e);
    }
  };

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
          {logo && displayStoreLogo && (
            <LoginImage>
              <ImageListItem
                sx={{
                  maxWidth: isMobile ? '175px' : '250px',
                }}
                onClick={() => {
                  window.location.href = '/';
                }}
              >
                <img src={`${logo}`} alt={b3Lang('global.tips.registerLogo')} loading="lazy" />
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
            variant="h5"
            sx={{
              margin: '16px 0',
            }}
          >
            {b3Lang('forgotpassword.resetPassword')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              margin: '0 16px 16px 16px',
            }}
          >
            {b3Lang('forgotpassword.requestEmail')}
          </Typography>
          <B3CustomForm
            formFields={forgotPasswordFields}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
            sx={{ margin: '0 16px', maxWidth: isMobile ? '311px' : '505px' }}
          />
          {isEnabledOnStorefront && isCaptchaMissing ? (
            <Typography
              variant="body1"
              sx={{
                color: 'red',
                display: 'flex',
                alignSelf: 'flex-start',
                marginLeft: '18px',
                marginTop: '2px',
                fontSize: '13px',
              }}
            >
              {b3Lang('login.loginText.missingCaptcha')}
            </Typography>
          ) : (
            ''
          )}
          {isEnabledOnStorefront ? (
            <Box sx={{ marginTop: '20px' }}>
              <Captcha
                siteKey={storefrontSiteKey}
                size="normal"
                email={emailAddressReset}
                handleGetKey={handleGetCaptchaKey}
              />
            </Box>
          ) : (
            ''
          )}
          <B3Sping isSpinning={isLoading} size={20} isFlex={false}>
            <B3ResetPassWordButton>
              <CustomButton
                type="submit"
                size="medium"
                onClick={handleSubmit(handleLoginClick)}
                variant="contained"
                sx={{ width: 'auto' }}
              >
                {b3Lang('forgotpassword.resetPasswordBtn')}
              </CustomButton>
            </B3ResetPassWordButton>
          </B3Sping>
        </Box>
      </Box>
    </B3Card>
  );
}

export default ForgotPassword;
