import { FieldValues, UseFormHandleSubmit, UseFormSetError } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import trim from 'lodash-es/trim';

import { useB3Lang } from '@/lib/lang';
import { updateB2BAccountSettings, updateBCAccountSettings } from '@/shared/service/b2b';
import {
  changeCustomerPassword,
  updateCompanyUserDetails,
  updateCustomerDetails,
} from '@/shared/service/bc';
import {
  CompanyUserExtraFieldsInput,
  CustomerFormFieldDefinition,
  CustomerFormFieldsInput,
} from '@/shared/service/bc/graphql/accountSetting';
import { Fields, ParamProps } from '@/types/accountSetting';
import { Customer } from '@/types/company';
import b2bLogger from '@/utils/b3Logger';
import { B3SStorage } from '@/utils/b3Storage';
import { snackbar } from '@/utils/b3Tip';
import { deCodeField } from '@/utils/registerUtils';

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
} from './utils';

interface UseAccountSettingsSubmitParams {
  isBCUser: boolean;
  useBcAccountSettings: boolean;
  companyId: number;
  customer: Customer;
  accountSettings: any;
  decryptionFields: Partial<Fields>[];
  extraFields: Partial<Fields>[];
  accountInfoFormFields: Partial<Fields>[];
  customerFormFieldDefs: CustomerFormFieldDefinition[];
  captchaToken: string;
  resetCaptcha: () => void;
  isCaptchaEnabled: boolean;
  isCaptchaConfigLoading: boolean;
  validateEmailValue: (email: string) => Promise<boolean>;
  emailValidation: (data: Partial<ParamProps>) => boolean;
  passwordValidation: (data: Partial<ParamProps>) => boolean;
  handleSubmit: UseFormHandleSubmit<FieldValues>;
  setError: UseFormSetError<FieldValues>;
  setLoading: (isLoading: boolean) => void;
  setIsFinishUpdate: (value: boolean) => void;
}

// Save/update for the account-settings form: resolves the submitted data into the right
// backend payload (BC native mutations vs. the legacy B2B middleware) and runs it. Grouped
// into its own hook — runMutation, dispatchUpdate, and handleAddUserClick are all part of the
// same save path and were making AccountSetting/index.tsx harder to follow as it grew.
export function useAccountSettingsSubmit({
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
  resetCaptcha,
  isCaptchaEnabled,
  isCaptchaConfigLoading,
  validateEmailValue,
  emailValidation,
  passwordValidation,
  handleSubmit,
  setError,
  setLoading,
  setIsFinishUpdate,
}: UseAccountSettingsSubmitParams) {
  const b3Lang = useB3Lang();
  const navigate = useNavigate();

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
          // reCaptcha v2 tokens are single-use; reset the widget so a retry can issue a new one.
          resetCaptcha();
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
            // reporting a save that silently dropped the edit. Surface the error on the
            // specific control(s) so the user knows which value to fix; fall back to the
            // generic snackbar only if a field couldn't be traced back to its control.
            if (unsendable.length > 0 || unsendableExtra.length > 0) {
              const fieldMessage = b3Lang('accountSettings.notification.fieldCannotBeSaved');
              let hasFieldLevelError = false;
              [...unsendable, ...unsendableExtra].forEach((field) => {
                if (field.formName) {
                  hasFieldLevelError = true;
                  setError(field.formName, { type: 'custom', message: fieldMessage });
                }
              });
              if (!hasFieldLevelError) {
                snackbar.error(b3Lang('global.error.genericMessage'));
              }
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

  return { handleAddUserClick };
}
