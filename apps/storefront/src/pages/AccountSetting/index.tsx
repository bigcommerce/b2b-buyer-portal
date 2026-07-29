import { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
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
} from '@/shared/service/b2b';
import {
  getCompanyUserDetails,
  getCustomerDetails,
  getCustomerFormFieldDefinitions,
} from '@/shared/service/bc';
import { CustomerFormFieldDefinition } from '@/shared/service/bc/graphql/accountSetting';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { CustomerRole, UserTypes } from '@/types';
import { Fields, ParamProps } from '@/types/accountSetting';
import b2bLogger from '@/utils/b3Logger';
import { snackbar } from '@/utils/b3Tip';
import { channelId, isCatalystPlatform } from '@/utils/basicConfig';
import { getAccountFormFields } from '@/utils/registerUtils';

import { getAccountSettingsFields, getPasswordModifiedFields } from './config';
import { UpgradeBanner } from './UpgradeBanner';
import { useAccountSettingsSubmit } from './useAccountSettingsSubmit';
import { initB2BInfo, initBcInfo, mapUserToAccountInfo } from './utils';

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
  const dedupeStorefrontConfigFetchCalls = useFeatureFlag(
    'B2B-5309.dedupe_storefront_config_fetch_calls',
  );

  // BC customers update via customer.updateCustomer, which needs a reCaptcha token
  // when reCaptcha is enabled on the storefront.
  const isCustomerUpdate = useBcAccountSettings && isBCUser;

  const [isMobile] = useMobile();

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
  const skipNextInitRef = useRef(false);

  // BC customer.updateCustomer needs a reCaptcha token when reCaptcha is enabled on the
  // storefront; load that config (shared with the forgot-password flow).
  const { isCaptchaEnabled, captchaSiteKey, isCaptchaConfigLoading } =
    useStorefrontCaptcha(isCustomerUpdate);

  useEffect(() => {
    const init = async () => {
      if (skipNextInitRef.current && dedupeStorefrontConfigFetchCalls) {
        skipNextInitRef.current = false;
        return;
      }

      skipNextInitRef.current = false;

      let didLoadSuccessfully = false;

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

        didLoadSuccessfully = true;
      } catch {
        snackbar.error(b3Lang('global.error.genericMessage'));
      } finally {
        if (isFinishUpdate) {
          snackbar.success(b3Lang('accountSettings.notification.detailsUpdated'));
          setIsFinishUpdate(false);
          if (dedupeStorefrontConfigFetchCalls && didLoadSuccessfully) {
            skipNextInitRef.current = true;
          }
        }
        setLoading(false);
      }
    };

    init();
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFinishUpdate, useBcAccountSettings]);

  const { handleAddUserClick } = useAccountSettingsSubmit({
    isBCUser,
    useBcAccountSettings,
    companyId,
    customer,
    accountSettings,
    decryptionFields,
    extraFields,
    accountInfoFormFields,
    customerFormFieldDefs,
    captchaToken,
    setCaptchaToken,
    isCaptchaEnabled,
    isCaptchaConfigLoading,
    validateEmailValue,
    emailValidation,
    passwordValidation,
    handleSubmit,
    setError,
    setLoading,
    setIsFinishUpdate,
  });

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
