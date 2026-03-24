import { MouseEvent, useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Box, Typography } from '@mui/material';

import { B3CustomForm } from '@/components/B3CustomForm';
import { Captcha } from '@/components/captcha/Captcha';
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useFeatureFlags } from '@/hooks/useFeatureFlags';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton/context';
import { GlobalContext } from '@/shared/global';
import { sendSubscribersState, uploadB2BFile } from '@/shared/service/b2b';
import { getStorefrontToken } from '@/shared/service/b2b/graphql/recaptcha';
import { RegisterCompanyStatus } from '@/shared/service/bc/graphql/company';
import { CompanyStatus } from '@/types/company';
import b2bLogger from '@/utils/b3Logger';
import { channelId, storeHash } from '@/utils/basicConfig';

import { RegisteredContext } from '../../../Context';
import { RegisterFields } from '../../../types';
import { PrimaryButton } from '../../PrimaryButton';
import { InformationFourLabels, TipContent } from '../../styled';

import {
  ensureBcStorefrontGraphqlToken,
  loginAndGetBcCustomer,
  logoutBcCustomer,
} from './bcHelpers';
import { createCompany } from './createCompany';
import { createCustomer } from './createCustomer';
import { registerCompany } from './registerCompany';

interface CompleteStepProps {
  handleBack: () => void;
  handleNext: (password: string) => void;
}

type CompleteStepList = Array<RegisterFields> | undefined;

export default function CompleteStep(props: CompleteStepProps) {
  const b3Lang = useB3Lang();
  const featureFlags = useFeatureFlags();
  const { handleBack, handleNext } = props;
  const [personalInfo, setPersonalInfo] = useState<Array<CustomFieldItems>>([]);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [enterEmail, setEnterEmail] = useState<string>('');

  const [captchaKey, setCaptchaKey] = useState('');
  const [isEnabledOnStorefront, setIsEnabledOnStorefront] = useState(false);
  const [storefrontSiteKey, setStorefrontSiteKey] = useState('');

  const [isCaptchaMissing, setIsCaptchaMissing] = useState(false);

  const handleGetCaptchaKey = (key: string) => setCaptchaKey(key);

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

  useEffect(() => {
    if (captchaKey) setIsCaptchaMissing(false);
  }, [captchaKey]);

  const {
    control,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm({
    mode: 'all',
  });
  const { state, dispatch } = useContext(RegisteredContext);

  const {
    state: { blockPendingAccountOrderCreation },
  } = useContext(GlobalContext);

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const customColor = getContrastColor(backgroundColor);

  const {
    contactInformation,
    bcContactInformation,
    passwordInformation = [],
    bcPasswordInformation = [],
    accountType,
    additionalInformation,
    bcAdditionalInformation,
    addressBasicFields = [],
    bcAddressBasicFields = [],
    companyInformation = [],
    emailMarketingNewsletter,
  } = state;

  const list: CompleteStepList = accountType === '1' ? contactInformation : bcContactInformation;
  const passwordInfo: CompleteStepList =
    accountType === '1' ? passwordInformation : bcPasswordInformation;

  const passwordName = passwordInfo[0]?.groupName || '';

  const additionalInfo: CompleteStepList =
    accountType === '1' ? additionalInformation : bcAdditionalInformation;

  const addressBasicList = accountType === '1' ? addressBasicFields : bcAddressBasicFields;

  const createCustomerContext = {
    emailMarketingNewsletter,
    list,
    additionalInfo,
    accountType,
    addressBasicList,
    captchaKey,
  };

  const createCompanyContext = {
    list,
    companyInformation,
    addressBasicList,
    genericRegistrationErrorMessage: b3Lang(
      'global.registerComplete.companyRegistrationGenericError',
    ),
  };

  useEffect(() => {
    if (!accountType) return;
    if (list && list.length) {
      const emailFields: CustomFieldItems =
        list.find((item: RegisterFields) => item.name === 'email') || {};

      setEnterEmail(emailFields?.default || '');
    }

    setPersonalInfo(passwordInfo);
  }, [contactInformation, bcContactInformation, accountType, list, passwordInfo]);

  const getFileUrl = async (attachmentsList: RegisterFields[]) => {
    let attachments: File[] = [];

    if (!attachmentsList.length) return undefined;

    attachmentsList.forEach((field: RegisterFields) => {
      attachments = (field.default as File[]) ?? [];
    });

    try {
      const fileResponse = await Promise.all(
        attachments.map((file: File) =>
          uploadB2BFile({
            file,
            type: 'companyAttachedFile',
          }),
        ),
      );

      const fileList = fileResponse.reduce(
        (
          accumulatedFileList: Array<Record<string, unknown>>,
          res: { code: number; data?: { errMsg?: string; fileSize?: string }; message?: string },
        ) => {
          if (res.code === 200) {
            const newData = {
              ...res.data,
            } as Record<string, unknown>;
            newData.fileSize = newData.fileSize ? `${newData.fileSize}` : '';
            return [...accumulatedFileList, newData];
          }
          const message =
            res.data?.errMsg || res.message || b3Lang('intl.global.fileUpload.fileUploadFailure');
          throw new Error(message);
        },
        [],
      );

      return fileList;
    } catch (error) {
      b2bLogger.error(error);
      throw error;
    }
  };

  const saveRegisterPassword = (data: CustomFieldItems) => {
    const newPasswordInformation = passwordInformation.map((field: RegisterFields) => {
      const registerField = field;
      if (accountType === '1') {
        registerField.default = data[field.name] ?? field.default;
      }
      return field;
    });

    const newBcPasswordInformation = bcPasswordInformation.map((field: RegisterFields) => {
      const registerField = field;
      if (accountType === '2') {
        registerField.default = data[field.name] ?? field.default;
      }

      return field;
    });

    dispatch({
      type: 'all',
      payload: {
        passwordInformation: newPasswordInformation,
        bcPasswordInformation: newBcPasswordInformation,
      },
    });
  };

  const handleSendSubscribersState = async () => {
    if (list && list.length > 0) {
      const emailMe = list.find(
        (item: CustomFieldItems) =>
          item.fieldId === 'field_email_marketing_newsletter' && item.fieldType === 'checkbox',
      );
      const firstName: CustomFieldItems =
        list.find((item: RegisterFields) => item.fieldId === 'field_first_name') || {};
      const lastName: CustomFieldItems =
        list.find((item: RegisterFields) => item.fieldId === 'field_last_name') || {};
      const isChecked = emailMe?.isChecked || false;
      const defaultValue = emailMe?.default || [];

      if (isChecked && (defaultValue as Array<string>).length > 0) {
        try {
          await sendSubscribersState({
            storeHash,
            email: enterEmail,
            first_name: firstName.default,
            last_name: lastName.default,
            channel_id: channelId || 1,
          });
        } catch (err: unknown) {
          setErrorMessage(err instanceof Error ? err.message : String(err));
        }
      }
    }
  };

  const handleCompleted = (event: MouseEvent) => {
    handleSubmit(async ({ password, confirmPassword }: CustomFieldItems) => {
      if (password !== confirmPassword) {
        setError('confirmPassword', {
          type: 'manual',
          message: b3Lang('global.registerComplete.passwordMatchPrompt'),
        });
        setError('password', {
          type: 'manual',
          message: b3Lang('global.registerComplete.passwordMatchPrompt'),
        });
        return;
      }

      if (isEnabledOnStorefront && !captchaKey) {
        setIsCaptchaMissing(true);
        return;
      }

      if (!isCaptchaMissing) {
        try {
          dispatch({
            type: 'loading',
            payload: {
              isLoading: true,
            },
          });

          let isAutoApproval = true;
          if (accountType === '2') {
            await createCustomer({ password, confirmPassword }, createCustomerContext);
          } else {
            const attachmentsList = companyInformation.filter((list) => list.fieldType === 'files');
            const fileList = await getFileUrl(attachmentsList || []);
            const { customerId, customerEmail } = await createCustomer(
              { password, confirmPassword },
              createCustomerContext,
            );

            if (featureFlags['B2B-4466.use_register_company_flow']) {
              await ensureBcStorefrontGraphqlToken();

              const customerDetails = await loginAndGetBcCustomer(
                {
                  email: customerEmail,
                  password,
                },
                b3Lang('global.error.genericMessage'),
              );
              const registerCompanyStatus = await registerCompany(
                customerDetails,
                fileList,
                createCompanyContext,
              );
              isAutoApproval = registerCompanyStatus === RegisterCompanyStatus.APPROVED;

              if (!isAutoApproval) {
                await logoutBcCustomer();
              }
            } else {
              const accountInfo = await createCompany(
                { password, confirmPassword },
                customerId,
                customerEmail,
                fileList,
                createCompanyContext,
              );

              const companyStatus = accountInfo?.companyCreate?.company?.companyStatus || '';
              isAutoApproval = Number(companyStatus) === CompanyStatus.APPROVED;
            }
          }
          dispatch({
            type: 'finishInfo',
            payload: {
              submitSuccess: true,
              isAutoApproval,
              blockPendingAccountOrderCreation,
            },
          });
          saveRegisterPassword({ password, confirmPassword });
          await handleSendSubscribersState();
          handleNext(password);
        } catch (err: unknown) {
          setErrorMessage(err instanceof Error ? err.message : String(err));
        } finally {
          dispatch({
            type: 'loading',
            payload: {
              isLoading: false,
            },
          });
        }
      }
    })(event);
  };

  return (
    <Box
      sx={{
        pl: 1,
        pr: 1,
        mt: 2,
        width: '100%',
        '& h4': {
          color: customColor,
        },
        '& input, & .MuiFormControl-root .MuiTextField-root': {
          borderRadius: '4px',
          borderBottomLeftRadius: '0',
          borderBottomRightRadius: '0',
        },
      }}
    >
      {errorMessage && (
        <Alert severity="error">
          <TipContent>{errorMessage}</TipContent>
        </Alert>
      )}
      <Box>
        <InformationFourLabels>{passwordName}</InformationFourLabels>
        {personalInfo && (
          <>
            {enterEmail.length > 0 && (
              <Box
                sx={{
                  fontSize: '16px',
                  fontWeight: 400,
                  color: '#000000',
                  marginBottom: '10px',
                  marginTop: '-12px',
                  wordWrap: 'break-word',
                }}
              >
                {b3Lang('global.registerComplete.createPasswordFor', { email: enterEmail })}
              </Box>
            )}
            <B3CustomForm formFields={personalInfo} errors={errors} control={control} />
          </>
        )}
        {isCaptchaMissing ? (
          <Typography
            variant="body1"
            sx={{
              color: 'red',
              display: 'flex',
              alignSelf: 'flex-start',
              marginLeft: '8px',
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
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'center',
              marginTop: '20px',
            }}
          >
            <Captcha siteKey={storefrontSiteKey} size="normal" handleGetKey={handleGetCaptchaKey} />
          </Box>
        ) : (
          ''
        )}
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          pt: 2,
          gap: 1,
        }}
      >
        <PrimaryButton onClick={handleBack}>{b3Lang('global.button.back')}</PrimaryButton>
        <PrimaryButton onClick={handleCompleted}>{b3Lang('global.button.submit')}</PrimaryButton>
      </Box>
    </Box>
  );
}
