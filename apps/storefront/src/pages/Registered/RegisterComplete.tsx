import { MouseEvent, useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Box, Typography } from '@mui/material';

import { B3CustomForm } from '@/components/B3CustomForm';
import { Captcha } from '@/components/captcha/Captcha';
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton/context';
import { GlobalContext } from '@/shared/global';
import {
  createB2BCompanyUser,
  createBCCompanyUser,
  sendSubscribersState,
  uploadB2BFile,
} from '@/shared/service/b2b';
import { getStorefrontToken } from '@/shared/service/b2b/graphql/recaptcha';
import b2bLogger from '@/utils/b3Logger';
import { channelId, storeHash } from '@/utils/basicConfig';

import { RegisteredContext } from './context/RegisteredContext';
import { deCodeField, toHump } from './config';
import { PrimaryButton } from './PrimaryButton';
import { InformationFourLabels, TipContent } from './styled';
import { RegisterFields } from './types';

interface RegisterCompleteProps {
  handleBack: () => void;
  handleNext: (password: string) => void;
}

type RegisterCompleteList = Array<RegisterFields> | undefined;

export default function RegisterComplete(props: RegisterCompleteProps) {
  const b3Lang = useB3Lang();
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

  const list: RegisterCompleteList =
    accountType === '1' ? contactInformation : bcContactInformation;
  const passwordInfo: RegisterCompleteList =
    accountType === '1' ? passwordInformation : bcPasswordInformation;

  const passwordName = passwordInfo[0]?.groupName || '';

  const additionalInfo: RegisterCompleteList =
    accountType === '1' ? additionalInformation : bcAdditionalInformation;

  const addressBasicList = accountType === '1' ? addressBasicFields : bcAddressBasicFields;

  useEffect(() => {
    if (!accountType) return;
    if (list && list.length) {
      const emailFields: CustomFieldItems =
        list.find((item: RegisterFields) => item.name === 'email') || {};

      setEnterEmail(emailFields?.default || '');
    }

    setPersonalInfo(passwordInfo);
  }, [contactInformation, bcContactInformation, accountType, list, passwordInfo]);

  const getBCFieldsValue = (data: CustomFieldItems) => {
    const bcFields: CustomFieldItems = {};

    bcFields.authentication = {
      force_password_reset: false,
      new_password: data.password,
    };

    bcFields.accepts_product_review_abandoned_cart_emails = emailMarketingNewsletter;

    if (list) {
      list.forEach((item: any) => {
        const name = deCodeField(item.name);
        if (name === 'accepts_marketing_emails') {
          bcFields.accepts_product_review_abandoned_cart_emails = !!item?.default?.length;
        } else if (!item.custom) {
          bcFields[name] = item?.default || '';
        }
      });

      bcFields.form_fields = [];
      if (additionalInfo && (additionalInfo as Array<CustomFieldItems>).length) {
        additionalInfo.forEach((field: CustomFieldItems) => {
          bcFields.form_fields.push({
            name: field.bcLabel,
            value: field.default,
          });
        });
      }
    }

    bcFields.addresses = [];
    bcFields.origin_channel_id = channelId;
    bcFields.channel_ids = [channelId];

    if (accountType === '2') {
      const addresses: CustomFieldItems = {};

      const getBCAddressField = addressBasicList.filter((field: any) => !field.custom);
      const getBCExtraAddressField = addressBasicList.filter((field: any) => field.custom);

      if (getBCAddressField) {
        bcFields.addresses = {};
        getBCAddressField.forEach((field: any) => {
          if (field.name === 'country') {
            addresses.country_code = field.default;
          } else if (field.name === 'state') {
            addresses.state_or_province = field.default;
          } else if (field.name === 'postalCode') {
            addresses.postal_code = field.default;
          } else if (field.name === 'firstName') {
            addresses.first_name = field.default;
          } else if (field.name === 'lastName') {
            addresses.last_name = field.default;
          } else {
            addresses[field.name] = field.default;
          }
        });
      }

      addresses.form_fields = [];
      // BC Extra field
      if (getBCExtraAddressField && getBCExtraAddressField.length) {
        getBCExtraAddressField.forEach((field: any) => {
          addresses.form_fields.push({
            name: field.bcLabel,
            value: field.default,
          });
        });
      }

      bcFields.addresses = [addresses];
      bcFields.trigger_account_created_notification = true;
    }

    const userItem = {
      storeHash,
      ...bcFields,
    };

    return createBCCompanyUser(userItem, captchaKey).then((res) => ({
      customerId: res.customerCreate.customer.id,
      customerEmail: res.customerCreate.customer.email,
    }));
  };

  const getB2BFieldsValue = async (
    _: CustomFieldItems,
    customerId: number | string,
    customerEmail: string,
    fileList: any,
  ) => {
    try {
      const b2bFields: CustomFieldItems = {};
      b2bFields.customerId = customerId || '';
      b2bFields.customerEmail = customerEmail;
      b2bFields.storeHash = storeHash;

      // company user extra field
      const b2bContactInformationList = list || [];
      const companyUserExtraFieldsList = b2bContactInformationList.filter((item) => !!item.custom);

      if (companyUserExtraFieldsList.length) {
        const companyUserExtraFields: Array<CustomFieldItems> = [];
        companyUserExtraFieldsList.forEach((item: CustomFieldItems) => {
          const itemExtraField: CustomFieldItems = {};
          itemExtraField.fieldName = deCodeField(item.name);
          itemExtraField.fieldValue = item?.default || '';
          companyUserExtraFields.push(itemExtraField);
        });
        b2bFields.userExtraFields = companyUserExtraFields;
      }

      const companyInfo = companyInformation.filter(
        (list) => !list.custom && list.fieldType !== 'files',
      );
      const companyExtraInfo = companyInformation.filter((list) => !!list.custom);
      // company field
      if (companyInfo.length) {
        companyInfo.forEach((item: any) => {
          b2bFields[toHump(deCodeField(item.name))] = item?.default || '';
        });
      }

      // Company Additional Field
      if (companyExtraInfo.length) {
        const extraFields: Array<CustomFieldItems> = [];
        companyExtraInfo.forEach((item: CustomFieldItems) => {
          const itemExtraField: CustomFieldItems = {};
          itemExtraField.fieldName = deCodeField(item.name);
          itemExtraField.fieldValue = item?.default || '';
          extraFields.push(itemExtraField);
        });
        b2bFields.extraFields = extraFields;
      }

      // address Field
      const addressBasicInfo = addressBasicList.filter((list) => !list.custom) || [];
      const addressExtraBasicInfo = addressBasicList.filter((list) => !!list.custom) || [];

      if (addressBasicInfo.length) {
        addressBasicInfo.forEach((field: CustomFieldItems) => {
          const name = deCodeField(field.name);
          if (name === 'address1') {
            b2bFields.addressLine1 = field.default;
          }
          if (name === 'address2') {
            b2bFields.addressLine2 = field.default;
          }
          b2bFields[name] = field.default;
        });
      }

      // address Additional Field
      if (addressExtraBasicInfo.length) {
        const extraFields: Array<CustomFieldItems> = [];
        addressExtraBasicInfo.forEach((item: CustomFieldItems) => {
          const itemExtraField: CustomFieldItems = {};
          itemExtraField.fieldName = deCodeField(item.name);
          itemExtraField.fieldValue = item?.default || '';
          extraFields.push(itemExtraField);
        });
        b2bFields.addressExtraFields = extraFields;
      }
      b2bFields.fileList = fileList;
      b2bFields.channelId = channelId;

      return await createB2BCompanyUser(b2bFields);
    } catch (error) {
      b2bLogger.error(error);
    }
    return undefined;
  };

  const getFileUrl = async (attachmentsList: RegisterFields[]) => {
    let attachments: File[] = [];

    if (!attachmentsList.length) return undefined;

    attachmentsList.forEach((field: any) => {
      attachments = field.default;
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

      const fileList = fileResponse.reduce((fileList: any, res: any) => {
        let list = fileList;
        if (res.code === 200) {
          const newData = {
            ...res.data,
          };
          newData.fileSize = newData.fileSize ? `${newData.fileSize}` : '';
          list = [...fileList, newData];
        } else {
          throw (
            res.data.errMsg || res.message || b3Lang('intl.global.fileUpload.fileUploadFailure')
          );
        }
        return list;
      }, []);

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
        registerField.default = data[field.name] || field.default;
      }
      return field;
    });

    const newBcPasswordInformation = bcPasswordInformation.map((field: RegisterFields) => {
      const registerField = field;
      if (accountType === '2') {
        registerField.default = data[field.name] || field.default;
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
        } catch (err: any) {
          setErrorMessage(err?.message || err);
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

          let isAuto = true;
          if (accountType === '2') {
            await getBCFieldsValue({ password, confirmPassword });
          } else {
            const attachmentsList = companyInformation.filter((list) => list.fieldType === 'files');
            const fileList = await getFileUrl(attachmentsList || []);
            const { customerId, customerEmail } = await getBCFieldsValue({
              password,
              confirmPassword,
            });
            const accountInfo = await getB2BFieldsValue(
              { password, confirmPassword },
              customerId,
              customerEmail,
              fileList,
            );

            const companyStatus = accountInfo?.companyCreate?.company?.companyStatus || '';
            isAuto = Number(companyStatus) === 1;
          }
          dispatch({
            type: 'finishInfo',
            payload: {
              submitSuccess: true,
              isAutoApproval: isAuto,
              blockPendingAccountOrderCreation,
            },
          });
          saveRegisterPassword({ password, confirmPassword });
          await handleSendSubscribersState();
          handleNext(password);
        } catch (err: any) {
          setErrorMessage(err?.message || err);
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
                {`Create password for ${enterEmail}`}
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
