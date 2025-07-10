import { useContext, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { Alert, Box, Typography } from '@mui/material';
import trim from 'lodash-es/trim';

import { B3CustomForm } from '@/components';
import CustomButton from '@/components/button/CustomButton';
import { b3HexToRgb, getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import B3Spin from '@/components/spin/B3Spin';
import { useMobile } from '@/hooks';
import useStorageState from '@/hooks/useStorageState';
import { CustomStyleContext } from '@/shared/customStyleButton';
import {
  checkUserBCEmail,
  checkUserEmail,
  getB2BAccountFormFields,
  getB2BAccountSettings,
  getBCAccountSettings,
  updateB2BAccountSettings,
  updateBCAccountSettings,
} from '@/shared/service/b2b';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { Fields, ParamProps } from '@/types/accountSetting';
import { B3SStorage, channelId, platform, snackbar } from '@/utils';

import { deCodeField, getAccountFormFields } from '../Registered/config';

import { getAccountSettingsFields, getPasswordModifiedFields } from './config';
import { b2bSubmitDataProcessing, bcSubmitDataProcessing, initB2BInfo, initBcInfo } from './utils';

function useData() {
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const customer = useAppSelector(({ company }) => company.customer);
  const role = useAppSelector(({ company }) => company.customer.role);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const companyId = role === 3 && isAgenting ? Number(salesRepCompanyId) : Number(companyInfoId);
  const isBCUser = !isB2BUser || (role === 3 && !isAgenting);

  const validateEmailValue = async (emailValue: string) => {
    if (customer.emailAddress === trim(emailValue)) return true;
    const payload = {
      email: emailValue,
      channelId,
    };

    const { isValid }: { isValid: boolean } = isBCUser
      ? await checkUserBCEmail(payload)
      : await checkUserEmail(payload);

    return isValid;
  };

  const emailValidation = (data: Partial<ParamProps>) => {
    if (data.email !== customer.emailAddress && !data.currentPassword) {
      return false;
    }

    return true;
  };

  const passwordValidation = (data: Partial<ParamProps>) => {
    if (data.password !== data.confirmPassword) {
      return false;
    }

    return true;
  };

  return { isBCUser, isB2BUser, companyId, customer, validateEmailValue, emailValidation, passwordValidation };
}

function AccountSetting() {
  const { isBCUser, isB2BUser, companyId, customer, validateEmailValue, emailValidation, passwordValidation } =
    useData();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
    setError,
  } = useForm({
    mode: 'onSubmit',
  });

  const [isFinishUpdate, setIsFinishUpdate] = useStorageState<boolean>(
    'sf-isFinishUpdate',
    false,
    sessionStorage,
  );

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const b3Lang = useB3Lang();

  const [isMobile] = useMobile();

  const navigate = useNavigate();

  const [accountInfoFormFields, setAccountInfoFormFields] = useState<Partial<Fields>[]>([]);
  const [decryptionFields, setDecryptionFields] = useState<Partial<Fields>[]>([]);
  const [extraFields, setExtraFields] = useState<Partial<Fields>[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [accountSettings, setAccountSettings] = useState<any>({});
  const [isVisible, setIsVisible] = useState<boolean>(false);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const fn = isBCUser ? getBCAccountSettings : getB2BAccountSettings;

        const params = isBCUser
          ? {}
          : {
              companyId,
            };

        const key = isBCUser ? 'customerAccountSettings' : 'accountSettings';

        const accountFormAllFields = await getB2BAccountFormFields(isBCUser ? 1 : 2);
        const accountFormFields = getAccountFormFields(
          accountFormAllFields.accountFormFields || [],
        );

        const contactInformation = (accountFormFields?.contactInformation || []).filter(
          (item: Partial<Fields>) => item.fieldId !== 'field_email_marketing_newsletter',
        );

        const { additionalInformation = [] } = accountFormFields;

        const { [key]: accountSettings } = await fn(params);

        const fields = isBCUser
          ? initBcInfo(accountSettings, contactInformation, additionalInformation)
          : initB2BInfo(
              accountSettings,
              contactInformation,
              getAccountSettingsFields(),
              additionalInformation,
            );

        const passwordModifiedFields = getPasswordModifiedFields();

        const all = [...fields, ...passwordModifiedFields];

        const roleItem = all.find((item) => item.name === 'role');

        if (roleItem?.fieldType) roleItem.fieldType = 'text';

        setAccountInfoFormFields(all);

        setAccountSettings(accountSettings);

        setDecryptionFields(contactInformation);

        setExtraFields(additionalInformation);
      } finally {
        if (isFinishUpdate) {
          snackbar.success(b3Lang('accountSettings.notification.detailsUpdated'));
          setIsFinishUpdate(false);
        }
        setLoading(false);
        setIsVisible(true);
      }
    };

    init();
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleGetUserExtraFields = (
    data: CustomFieldItems,
    accountInfoFormFields: Partial<Fields>[],
  ) => {
    const userExtraFields = accountInfoFormFields.filter(
      (item: CustomFieldItems) => item.custom && item.groupId === 1,
    );
    return userExtraFields.map((item: CustomFieldItems) => ({
      fieldName: deCodeField(item?.name || ''),
      fieldValue: data[item.name],
    }));
  };

  const handleAddUserClick = () => {
    handleSubmit(async (data: CustomFieldItems) => {
      setLoading(true);

      try {
        const isValid = await validateEmailValue(data.email);

        if (!isValid) {
          setError('email', {
            type: 'custom',
            message: b3Lang('accountSettings.notification.emailExists'),
          });
        }

        const emailFlag = emailValidation(data);

        if (!emailFlag) {
          snackbar.error(b3Lang('accountSettings.notification.updateEmailPassword'));
        }

        const passwordFlag = passwordValidation(data);

        if (!passwordFlag) {
          setError('confirmPassword', {
            type: 'manual',
            message: b3Lang('global.registerComplete.passwordMatchPrompt'),
          });
          setError('password', {
            type: 'manual',
            message: b3Lang('global.registerComplete.passwordMatchPrompt'),
          });
        }

        if (isValid && emailFlag && passwordFlag) {
          const dataProcessingFn = isBCUser ? bcSubmitDataProcessing : b2bSubmitDataProcessing;
          const payload = dataProcessingFn(data, accountSettings, decryptionFields, extraFields);

          if (payload) {
            if (!isBCUser) {
              payload.companyId = companyId;
              payload.extraFields = handleGetUserExtraFields(data, accountInfoFormFields);
            }

            if (payload.newPassword === '' && payload.confirmPassword === '') {
              delete payload.newPassword;
              delete payload.confirmPassword;
            }
          }

          if (!payload) {
            snackbar.success(b3Lang('accountSettings.notification.noEdits'));
            return;
          }

          const requestFn = isBCUser ? updateBCAccountSettings : updateB2BAccountSettings;
          await requestFn(payload);

          if (
            (data.password && data.currentPassword) ||
            customer.emailAddress !== trim(data.email)
          ) {
            navigate('/login?loginFlag=loggedOutLogin');
          } else {
            B3SStorage.clear();
            setIsFinishUpdate(true);
            window.location.reload();
          }
        }
      } finally {
        setLoading(false);
      }
    })();
  };

  const translatedFields = useMemo(() => {
    const fieldTranslations: Record<string, string> = {
      field_first_name: b3Lang('accountSettings.form.firstName'),
      field_last_name: b3Lang('accountSettings.form.lastName'),
      field_email: b3Lang('accountSettings.form.email'),
      field_phone_number: b3Lang('accountSettings.form.phoneNumber'),
      field_company: b3Lang('accountSettings.form.company'),
      field_role: b3Lang('accountSettings.form.role'),
      field_current_password: b3Lang('accountSettings.form.currentPassword'),
      field_password: b3Lang('accountSettings.form.password'),
      field_confirm_password: b3Lang('accountSettings.form.confirmPassword'),
    };

    return accountInfoFormFields.map((item) => ({
      ...item,
      label: fieldTranslations[item.fieldId ?? ''] ?? item.label,
    }));
  }, [accountInfoFormFields, b3Lang]);

  return (
    <B3Spin isSpinning={isLoading} background={backgroundColor}>
      <Box>
        {!isB2BUser && platform === 'catalyst' && (
          <Box>
            <Alert
              severity='info'
              variant='filled'
              sx={{
                width: 'inherit',
                '& button[title="Close"]': {
                  display: 'block', 
                },
                mb: '24px',
                maxWidth: '1450px',

                '& .MuiAlert-icon': {
                  padding:'12px 0',
                },

                '& .MuiAlert-message': {
                  width: '100%',
                }
              }}
            >
              <Box display="flex" flexWrap="wrap" justifyContent="space-between" width="100%">
                <Box>
                  <Typography variant="subtitle1" fontWeight="800">{b3Lang('accountSettings.registeredToB2b.title')}</Typography>
                  <Typography sx={{ textWrap:'wrap' }}>{b3Lang('accountSettings.registeredToB2b.description')}</Typography>
                </Box>
                <Typography component={Link} to="/registeredbctob2b" sx={{ textDecoration: 'none', textTransform: 'uppercase' }} fontWeight="bold" color="#fff">{b3Lang('accountSettings.registeredToB2b.upgrade')}</Typography>
              </Box>
            </Alert>
          </Box>
        )}
        <Box
          sx={{
            width: isMobile ? '100%' : '35%',
            minHeight: isMobile ? '800px' : '300px',
            '& input, & .MuiFormControl-root .MuiTextField-root, & .MuiSelect-select.MuiSelect-filled, & .MuiTextField-root .MuiInputBase-multiline':
              {
                bgcolor: b3HexToRgb('#FFFFFF', 0.87),
                borderRadius: '4px',
                borderBottomLeftRadius: '0',
                borderBottomRightRadius: '0',
              },
            '& .MuiButtonBase-root.MuiCheckbox-root:not(.Mui-checked), & .MuiRadio-root:not(.Mui-checked)':
              {
                color: b3HexToRgb(getContrastColor(backgroundColor), 0.6),
              },
            '& .MuiTypography-root.MuiTypography-body1.MuiFormControlLabel-label, & .MuiFormControl-root .MuiFormLabel-root:not(.Mui-focused)':
              {
                color: b3HexToRgb(getContrastColor(backgroundColor), 0.87),
              },
            '& .MuiInputLabel-root.MuiInputLabel-formControl:not(.Mui-focused)': {
              color: b3HexToRgb(getContrastColor('#FFFFFF'), 0.6),
            },
          }}
        >
          <B3CustomForm
            formFields={translatedFields}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />

          <CustomButton
            sx={{
              mt: '28px',
              mb: isMobile ? '20px' : '0',
              width: '100%',
              visibility: isVisible ? 'visible' : 'hidden',
            }}
            onClick={handleAddUserClick}
            variant="contained"
          >
            {b3Lang('accountSettings.button.saveUpdates')}
          </CustomButton>
        </Box>
      </Box>
    </B3Spin>
  );
}

export default AccountSetting;
