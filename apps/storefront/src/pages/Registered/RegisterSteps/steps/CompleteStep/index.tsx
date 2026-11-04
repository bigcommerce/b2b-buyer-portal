import { MouseEvent, useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Box, Typography } from '@mui/material';

import { B3CustomForm } from '@/components/B3CustomForm';
import { Captcha } from '@/components/captcha/Captcha';
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton/context';
import { GlobalContext } from '@/shared/global';
import { sendSubscribersState, uploadB2BFile } from '@/shared/service/b2b';
import { getStorefrontToken } from '@/shared/service/b2b/graphql/recaptcha';
import {
  RegisterCompanyStatus,
  type UploadedCompanyFile,
} from '@/shared/service/bc/graphql/company';
import { CompanyStatus } from '@/types/company';
import b2bLogger from '@/utils/b3Logger';
import { channelId, isBigCommercePlatform, storeHash } from '@/utils/basicConfig';
import { ensureBcGraphqlToken } from '@/utils/loginInfo';
import { performStorefrontLogout } from '@/utils/performStorefrontLogout';

import { RegisteredContext } from '../../../Context';
import { RegisterAccountType, RegisterFields } from '../../../types';
import { PrimaryButton } from '../../PrimaryButton';
import { InformationFourLabels, TipContent } from '../../styled';

import { loginAndGetBcCustomer } from './bcHelpers';
import { createCompany } from './createCompany';
import { createCustomer } from './createCustomer';
import { registerCompany } from './registerCompany';

interface CompleteStepProps {
  handleBack: () => void;
  handleNext: (password: string) => void;
}

type CompleteStepList = Array<RegisterFields> | undefined;

type PasswordCredentials = {
  password: string;
  confirmPassword: string;
};

export default function CompleteStep(props: CompleteStepProps) {
  const b3Lang = useB3Lang();
  const isRegisterCompanyFlowEnabled = useFeatureFlag('B2B-4466.use_register_company_flow');
  const { handleBack, handleNext } = props;
  const [errorMessage, setErrorMessage] = useState<string>('');

  const [captchaKey, setCaptchaKey] = useState('');
  const [isEnabledOnStorefront, setIsEnabledOnStorefront] = useState(false);
  const [storefrontSiteKey, setStorefrontSiteKey] = useState('');

  const [isCaptchaMissing, setIsCaptchaMissing] = useState(false);

  const handleGetCaptchaKey = (key: string) => {
    setCaptchaKey(key);
    if (key) setIsCaptchaMissing(false);
  };

  useEffect(() => {
    let ignore = false;

    const getIsEnabledOnStorefront = async () => {
      try {
        const response = await getStorefrontToken();

        if (response && !ignore) {
          setIsEnabledOnStorefront(response.isEnabledOnStorefront);
          setStorefrontSiteKey(response.siteKey);
        }
      } catch (e) {
        b2bLogger.error(e);
      }
    };

    getIsEnabledOnStorefront();

    return () => {
      ignore = true;
    };
  }, []);

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

  const list: CompleteStepList =
    accountType === RegisterAccountType.BUSINESS ? contactInformation : bcContactInformation;
  const passwordInfo: CompleteStepList =
    accountType === RegisterAccountType.BUSINESS ? passwordInformation : bcPasswordInformation;

  const passwordName = passwordInfo[0]?.groupName || '';

  const personalInfo: Array<CustomFieldItems> = accountType ? passwordInfo : [];
  const enterEmail = accountType
    ? String(list?.find((item: RegisterFields) => item.name === 'email')?.default ?? '')
    : '';

  const additionalInfo: CompleteStepList =
    accountType === RegisterAccountType.BUSINESS ? additionalInformation : bcAdditionalInformation;

  const addressBasicList =
    accountType === RegisterAccountType.BUSINESS ? addressBasicFields : bcAddressBasicFields;

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
      if (accountType === RegisterAccountType.BUSINESS) {
        registerField.default = data[field.name] ?? field.default;
      }
      return field;
    });

    const newBcPasswordInformation = bcPasswordInformation.map((field: RegisterFields) => {
      const registerField = field;
      if (accountType === RegisterAccountType.PERSONAL) {
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

  // Personal accounts are always auto-approved
  const registerPersonalAccount = async (credentials: PasswordCredentials): Promise<boolean> => {
    await createCustomer(credentials, createCustomerContext);

    return true;
  };

  const registerViaCompanyFlow = async (
    customerEmail: string,
    password: string,
    attachmentFields: RegisterFields[],
  ): Promise<boolean> => {
    await ensureBcGraphqlToken();

    const customerDetails = await loginAndGetBcCustomer(
      {
        email: customerEmail,
        password,
      },
      b3Lang('global.error.genericMessage'),
    );
    const fileList = await getFileUrl(attachmentFields || []);
    const registerCompanyStatus = await registerCompany(
      customerDetails,
      fileList as UploadedCompanyFile[] | undefined,
      createCompanyContext,
    );
    const isAutoApproval = registerCompanyStatus === RegisterCompanyStatus.APPROVED;

    if (!isAutoApproval) {
      await performStorefrontLogout();
    }

    return isAutoApproval;
  };

  const registerViaLegacyFlow = async (
    credentials: PasswordCredentials,
    customerId: number,
    customerEmail: string,
    attachmentFields: RegisterFields[],
  ): Promise<boolean> => {
    const fileList = await getFileUrl(attachmentFields || []);
    const accountInfo = await createCompany(
      credentials,
      customerId,
      customerEmail,
      fileList,
      createCompanyContext,
    );

    const companyStatus = accountInfo?.companyCreate?.company?.companyStatus || '';

    return Number(companyStatus) === CompanyStatus.APPROVED;
  };

  const registerBusinessAccount = async (credentials: PasswordCredentials): Promise<boolean> => {
    const attachmentFields = companyInformation.filter((field) => field.fieldType === 'files');
    const { customerId, customerEmail } = await createCustomer(credentials, createCustomerContext);

    if (isRegisterCompanyFlowEnabled && isBigCommercePlatform()) {
      return registerViaCompanyFlow(customerEmail, credentials.password, attachmentFields);
    }

    return registerViaLegacyFlow(credentials, customerId, customerEmail, attachmentFields);
  };

  const validatePasswordsMatch = (password: string, confirmPassword: string): boolean => {
    if (password === confirmPassword) return true;

    const message = b3Lang('global.registerComplete.passwordMatchPrompt');
    setError('confirmPassword', { type: 'manual', message });
    setError('password', { type: 'manual', message });

    return false;
  };

  const handleCompleted = (event: MouseEvent) => {
    handleSubmit(async ({ password, confirmPassword }: CustomFieldItems) => {
      if (!validatePasswordsMatch(password, confirmPassword)) {
        return;
      }

      if (isEnabledOnStorefront && !captchaKey) {
        setIsCaptchaMissing(true);
        return;
      }

      if (isCaptchaMissing) {
        return;
      }

      try {
        dispatch({ type: 'loading', payload: { isLoading: true } });

        const isAutoApproval =
          accountType === RegisterAccountType.PERSONAL
            ? await registerPersonalAccount({ password, confirmPassword })
            : await registerBusinessAccount({ password, confirmPassword });

        dispatch({
          type: 'finishInfo',
          payload: { submitSuccess: true, isAutoApproval, blockPendingAccountOrderCreation },
        });
        saveRegisterPassword({ password, confirmPassword });
        await handleSendSubscribersState();
        handleNext(password);
      } catch (err: unknown) {
        setErrorMessage(err instanceof Error ? err.message : String(err));
      } finally {
        dispatch({ type: 'loading', payload: { isLoading: false } });
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
