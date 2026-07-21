import { useContext, useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';
import trim from 'lodash-es/trim';

import { B3CustomForm } from '@/components/B3CustomForm';
import CustomButton from '@/components/button/CustomButton';
import { Captcha } from '@/components/captcha/Captcha';
import { b3HexToRgb, getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import B3Spin from '@/components/spin/B3Spin';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useMobile } from '@/hooks/useMobile';
import useStorageState from '@/hooks/useStorageState';
import { useStorefrontCaptcha } from '@/hooks/useStorefrontCaptcha';
import { useB3Lang } from '@/lib/lang';
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
import {
  changeCustomerPassword,
  getCompanyUserDetails,
  getCustomerDetails,
  getCustomerFormFieldDefinitions,
  updateCompanyUserDetails,
  updateCustomerDetails,
} from '@/shared/service/bc';
import {
  CompanyUserExtraFieldsInput,
  CustomerFormFieldDefinition,
  CustomerFormFieldsInput,
} from '@/shared/service/bc/graphql/accountSetting';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { CustomerRole, UserTypes } from '@/types';
import { Fields, ParamProps } from '@/types/accountSetting';
import b2bLogger from '@/utils/b3Logger';
import { B3SStorage } from '@/utils/b3Storage';
import { snackbar } from '@/utils/b3Tip';
import { channelId, isCatalystPlatform } from '@/utils/basicConfig';
import { deCodeField, getAccountFormFields } from '@/utils/registerUtils';

import { getAccountSettingsFields, getPasswordModifiedFields } from './config';
import { UpgradeBanner } from './UpgradeBanner';
import {
  b2bSubmitDataProcessing,
  bcSubmitDataProcessing,
  buildExtraFieldsInput,
  buildFormFieldsInput,
  buildUpdateCompanyUserInput,
  buildUpdateCustomerInput,
  collectChangedExtraFields,
  collectChangedFormFields,
  CONTACT_GROUP_ID,
  initB2BInfo,
  initBcInfo,
  mapUserToAccountInfo,
} from './utils';

function useData() {
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const customer = useAppSelector(({ company }) => company.customer);
  const role = useAppSelector(({ company }) => company.customer.role);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);
  const companyId = role === 3 && isAgenting ? Number(salesRepCompanyId) : Number(companyInfoId);
  const isBCUser = !isB2BUser || (role === 3 && !isAgenting);
  const isDisplayUpgradeBanner =
    CustomerRole.B2C === customer.role &&
    [UserTypes.B2C, UserTypes.MULTIPLE_B2C].includes(customer.userType) &&
    isCatalystPlatform();

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

  return {
    isBCUser,
    companyId,
    customer,
    validateEmailValue,
    emailValidation,
    passwordValidation,
    isDisplayUpgradeBanner,
  };
}

function AccountSetting() {
  const {
    isBCUser,
    companyId,
    customer,
    validateEmailValue,
    emailValidation,
    passwordValidation,
    isDisplayUpgradeBanner,
  } = useData();

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

  const useBcAccountSettings = useFeatureFlag('PROJECT-7920.use_bc_account_settings');

  // BC customers update via customer.updateCustomer, which needs a reCaptcha token
  // when reCaptcha is enabled on the storefront.
  const isCustomerUpdate = useBcAccountSettings && isBCUser;

  const [isMobile] = useMobile();

  const navigate = useNavigate();

  const [accountInfoFormFields, setAccountInfoFormFields] = useState<Partial<Fields>[]>([]);
  const [decryptionFields, setDecryptionFields] = useState<Partial<Fields>[]>([]);
  const [extraFields, setExtraFields] = useState<Partial<Fields>[]>([]);
  const [isLoading, setLoading] = useState<boolean>(false);
  const [accountSettings, setAccountSettings] = useState<any>({});
  const [customerFormFieldDefs, setCustomerFormFieldDefs] = useState<CustomerFormFieldDefinition[]>(
    [],
  );
  const [captchaToken, setCaptchaToken] = useState<string>('');
  const [isVisible, setIsVisible] = useState<boolean>(false);

  // BC customer.updateCustomer needs a reCaptcha token when reCaptcha is enabled on the
  // storefront; load that config (shared with the forgot-password flow).
  const { isCaptchaEnabled, captchaSiteKey, isCaptchaConfigLoading } =
    useStorefrontCaptcha(isCustomerUpdate);

  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);

        const accountFormAllFields = await getB2BAccountFormFields(isBCUser ? 1 : 2);
        const accountFormFields = getAccountFormFields(
          accountFormAllFields.accountFormFields || [],
        );

        const contactInformation = (accountFormFields?.contactInformation || []).filter(
          (item) => item.fieldId !== 'field_email_marketing_newsletter',
        ) as Partial<Fields>[];

        const additionalInformation = (accountFormFields?.additionalInformation ??
          []) as Partial<Fields>[];

        // Store the customer form-field definitions (option entityIds for choice fields),
        // surfacing — not swallowing — a failed fetch since it's what blocks choice fields.
        const applyFormFieldDefinitions = (
          definitions: Awaited<ReturnType<typeof getCustomerFormFieldDefinitions>> | undefined,
        ) => {
          if (definitions?.errors?.length) {
            b2bLogger.error(
              `Customer form-field definitions unavailable: ${definitions.errors[0]?.message}`,
            );
          }
          setCustomerFormFieldDefs(definitions?.data?.site?.settings?.formFields?.customer ?? []);
        };

        let accountSettings;
        if (useBcAccountSettings) {
          // Definitions supply choice option ids AND the entityId fallback (by label) for any
          // custom field whose fieldId isn't `field_<id>`, so fetch them whenever the form has
          // any custom field — not only choice fields.
          const needsDefinitions = [...contactInformation, ...additionalInformation].some(
            (item) => item.custom,
          );
          const definitionsPromise = needsDefinitions
            ? getCustomerFormFieldDefinitions()
            : Promise.resolve(undefined);

          let userData;
          if (isBCUser) {
            const [response, definitions] = await Promise.all([
              getCustomerDetails(),
              definitionsPromise,
            ]);
            if (response.errors?.length) throw new Error(response.errors[0]?.message);
            userData = response.data?.customer;
            applyFormFieldDefinitions(definitions);
          } else {
            const [response, definitions] = await Promise.all([
              getCompanyUserDetails(),
              definitionsPromise,
            ]);
            if (response.errors?.length) throw new Error(response.errors[0]?.message);
            userData = response.data?.company?.companyUser;
            applyFormFieldDefinitions(definitions);
          }

          if (!userData) throw new Error('Account settings response did not include a user');

          accountSettings = mapUserToAccountInfo(userData);
        } else {
          const fn = isBCUser ? getBCAccountSettings : getB2BAccountSettings;
          const params = isBCUser ? {} : { companyId };
          const key = isBCUser ? 'customerAccountSettings' : 'accountSettings';

          const { [key]: legacyAccountSettings } = await fn(params);
          accountSettings = legacyAccountSettings;
        }

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

        setIsVisible(true);
      } catch {
        snackbar.error(b3Lang('global.error.genericMessage'));
      } finally {
        if (isFinishUpdate) {
          snackbar.success(b3Lang('accountSettings.notification.detailsUpdated'));
          setIsFinishUpdate(false);
        }
        setLoading(false);
      }
    };

    init();
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinishUpdate, useBcAccountSettings]);

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

  const runMutation = async (
    run: () => Promise<{
      errors?: Array<{ message: string }>;
      resultErrors?: Array<{ message?: string }> | null;
    }>,
  ): Promise<boolean> => {
    let result;
    try {
      result = await run();
    } catch (error) {
      b2bLogger.error(error);
      snackbar.error(b3Lang('global.error.genericMessage'));
      return false;
    }
    if (result.errors?.length || result.resultErrors?.length) {
      const message = result.errors?.[0]?.message || result.resultErrors?.[0]?.message;
      snackbar.error(message || b3Lang('global.error.genericMessage'));
      return false;
    }
    return true;
  };

  // Sends the prepared payload to the right backend for the current user/flag combination.
  // `formFields` is the pre-resolved entityId-keyed group (built once by the caller). Returns
  // true on success; false means an error was already surfaced and the caller stops.
  const dispatchUpdate = async (
    payload: Partial<ParamProps>,
    formFields?: CustomerFormFieldsInput,
    extraFields?: CompanyUserExtraFieldsInput,
  ): Promise<boolean> => {
    if (useBcAccountSettings && isBCUser) {
      const customerInput = buildUpdateCustomerInput(payload, formFields);
      const hasProfileUpdate = Object.keys(customerInput).length > 0;

      // Check the reCaptcha gates up front (they guard updateCustomer) so we don't attempt the
      // details update — and its password follow-up — with a token that can't be accepted.
      if (hasProfileUpdate) {
        if (isCaptchaConfigLoading) {
          snackbar.error(b3Lang('global.error.genericMessage'));
          return false;
        }
        if (isCaptchaEnabled && !captchaToken) {
          snackbar.error(b3Lang('login.loginText.missingCaptcha'));
          return false;
        }
      }

      // Update the profile details first; only change the password if that succeeds so we never
      // commit a password change against a details update that failed.
      if (hasProfileUpdate) {
        let ok;
        try {
          ok = await runMutation(() =>
            updateCustomerDetails(customerInput, captchaToken || undefined).then((res) => ({
              errors: res.errors,
            })),
          );
        } finally {
          // reCaptcha v2 tokens are single-use; drop it so a retry forces a fresh solve.
          setCaptchaToken('');
        }
        if (!ok) return false;
      }

      // Details update succeeded (or there was none); now change the password if requested.
      if (payload.newPassword) {
        return runMutation(() =>
          changeCustomerPassword(
            (payload.currentPassword as string) || '',
            payload.newPassword as string,
          ).then((res) => ({
            errors: res.errors,
            resultErrors: res.data?.customer?.changePassword?.errors,
          })),
        );
      }

      return true;
    }

    if (useBcAccountSettings && !isBCUser) {
      return runMutation(() =>
        updateCompanyUserDetails(
          buildUpdateCompanyUserInput(payload, formFields, extraFields),
        ).then((res) => ({
          errors: res.errors,
          resultErrors: res.data?.company?.updateCompanyUser?.errors,
        })),
      );
    }

    // Legacy b2b middleware path (flag off).
    const requestFn = isBCUser ? updateBCAccountSettings : updateB2BAccountSettings;
    await requestFn(payload);
    return true;
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
          let payload = dataProcessingFn(data, accountSettings, decryptionFields, extraFields);

          // Native SF GQL custom fields are resolved to their typed groups once here; the same
          // build reports any changed field that can't be sent so we fail loudly.
          let customerFormFields;
          let customerExtraFields;
          if (useBcAccountSettings) {
            // BC keeps every custom field as an entityId-keyed form field; for B2B the
            // company-user's own custom fields (contact group) are name-keyed extraFields,
            // while any additional BC form fields stay entityId-keyed.
            const formFieldConfig = isBCUser
              ? accountInfoFormFields
              : accountInfoFormFields.filter((item) => item.groupId !== CONTACT_GROUP_ID);
            const changedFormFields = collectChangedFormFields(
              data,
              formFieldConfig,
              accountSettings?.formFields || [],
              customerFormFieldDefs,
            );
            const changedExtraFields = isBCUser
              ? []
              : collectChangedExtraFields(
                  data,
                  accountInfoFormFields,
                  accountSettings?.extraFields || [],
                );

            const { formFields, unsendable } = buildFormFieldsInput(
              changedFormFields,
              customerFormFieldDefs,
            );
            const { extraFields, unsendable: unsendableExtra } =
              buildExtraFieldsInput(changedExtraFields);
            // Fail loudly if a changed field can't be sent (unmapped choice option, cleared
            // number/date, missing entityId, or an array-valued extra field) rather than
            // reporting a save that silently dropped the edit.
            if (unsendable.length > 0 || unsendableExtra.length > 0) {
              snackbar.error(b3Lang('global.error.genericMessage'));
              return;
            }
            customerFormFields = formFields;
            customerExtraFields = extraFields;
            // Treat a field-only edit as non-pristine so it isn't dropped as "no edits".
            if (!payload && (formFields || extraFields)) payload = {};
          }

          if (payload) {
            // Legacy B2B middleware still expects name-based extra fields + companyId.
            if (!useBcAccountSettings && !isBCUser) {
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

          const succeeded = await dispatchUpdate(payload, customerFormFields, customerExtraFields);
          if (!succeeded) return;

          if (
            (data.password && data.currentPassword) ||
            customer.emailAddress !== trim(data.email)
          ) {
            navigate('/login?loginFlag=loggedOutLogin');
          } else {
            B3SStorage.clear();
            setIsFinishUpdate(true);
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
        {isDisplayUpgradeBanner && <UpgradeBanner />}
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

          {isCustomerUpdate && isCaptchaEnabled && (
            <Box sx={{ mt: '20px' }}>
              <Captcha siteKey={captchaSiteKey} size="normal" handleGetKey={setCaptchaToken} />
            </Box>
          )}

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
