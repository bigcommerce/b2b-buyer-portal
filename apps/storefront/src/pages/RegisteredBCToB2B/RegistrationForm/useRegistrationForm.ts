import { type MouseEvent, useCallback, useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import isEmpty from 'lodash-es/isEmpty';

import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { Country, getIsStateRequired, State } from '@/pages/Registered/config';
import { RegisteredContext } from '@/pages/Registered/Context';
import type { RegisterFields } from '@/pages/Registered/types';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import {
  createB2BCompanyUser,
  uploadB2BFile,
  validateBCCompanyExtraFields,
  validateBCCompanyUserExtraFields,
} from '@/shared/service/b2b';
import { RegisterCompanyStatus } from '@/shared/service/bc/graphql/company';
import { useAppSelector } from '@/store';
import b2bLogger from '@/utils/b3Logger';
import { Base64 } from '@/utils/base64';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';
import { deCodeField } from '@/utils/registerUtils';

import {
  buildB2bCompanyCreatePayloadForBcToB2b,
  buildCompanyUserExtraFieldsForBcToB2b,
  getRegisterFieldValueForBcToB2bForm,
  getRegisterFieldValueForBcToB2bFormValidation,
} from './createCompany';
import { submitBcToB2bRegisterCompany } from './registerCompany';

interface UseRegistrationFormParams {
  onRegistrationSuccess: () => void;
}

export function useRegistrationForm({ onRegistrationSuccess }: UseRegistrationFormParams) {
  const b3Lang = useB3Lang();
  const isRegisterCompanyFlowEnabled = useFeatureFlag('B2B-4466.use_register_company_flow');
  const useGrpcGeoForStateRequiredFlag = useFeatureFlag(
    'B2B-4481.use_grpc_geo_for_state_required_flag',
  );
  const [isMobile] = useMobile();
  const [errorMessage, setErrorMessage] = useState('');

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
    setError,
    watch,
  } = useForm({
    mode: 'onSubmit',
  });

  const {
    state: { blockPendingAccountOrderCreation },
  } = useContext(GlobalContext);

  const customer = useAppSelector(({ company }) => company.customer);
  const { id: customerId, emailAddress, firstName, lastName, phoneNumber } = customer;

  const { state, dispatch } = useContext(RegisteredContext);

  const {
    state: { companyAutoApproval },
  } = useContext(CustomStyleContext);

  const {
    bcTob2bContactInformation,
    bcTob2bCompanyInformation = [],
    bcTob2bAddressBasicFields = [],
    countryList = [],
    bcTob2bCompanyExtraFields = [],
  } = state;

  const showLoading = useCallback(
    (isShow = false) => {
      dispatch({
        type: 'loading',
        payload: {
          isLoading: isShow,
        },
      });
    },
    [dispatch],
  );

  useEffect(() => {
    const handleCountryChange = (countryCode: string, stateCode = '') => {
      const country = countryList.find(
        (c: Country) => c.countryCode === countryCode || c.countryName === countryCode,
      );
      const stateList = country?.states || [];
      const isStateRequired = getIsStateRequired(
        country,
        stateList,
        useGrpcGeoForStateRequiredFlag,
      );
      const stateFields = bcTob2bAddressBasicFields.find(
        (formFields: RegisterFields) => formFields.name === 'state',
      );

      if (stateFields) {
        if (stateList.length > 0) {
          stateFields.fieldType = 'dropdown';
          stateFields.options = stateList;
          stateFields.required = isStateRequired;
        } else {
          stateFields.fieldType = 'text';
          stateFields.options = [];
          stateFields.required = isStateRequired;
        }
      }

      setValue(
        'state',
        stateCode &&
          countryCode &&
          (stateList.find((s: State) => s.stateCode === stateCode) || stateList.length === 0)
          ? stateCode
          : '',
      );

      dispatch({
        type: 'stateList',
        payload: {
          stateList,
          bcTob2bAddressBasicFields: [...bcTob2bAddressBasicFields],
        },
      });
    };

    const handleInitCountryAndState = () => {
      const countryValue = getValues('country');
      const stateValue = getValues('state');
      handleCountryChange(countryValue, stateValue);
    };
    handleInitCountryAndState();

    const subscription = watch((value, { name, type }) => {
      const { country, state } = value;
      if (name === 'country' && type === 'change') {
        handleCountryChange(country, state);
      }
    });
    return () => subscription.unsubscribe();
    // Intentionally depend only on `countryList`: re-run when countries load from the server.
    // Other values (dispatch, address field defs, setValue) are omitted so we do not tear down
    // and recreate the country `watch` subscription on every context update from this effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryList]);

  const getFileUrl = async (attachmentsList: RegisterFields[], data: CustomFieldItems) => {
    let attachments: File[] = [];

    if (!attachmentsList.length) return undefined;

    attachmentsList.forEach((field: RegisterFields & { name: string }) => {
      attachments = data[field.name] || [];
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
        (fileList: CustomFieldItems[], res: CustomFieldItems) => {
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
        },
        [],
      );

      return fileList;
    } catch (error) {
      b2bLogger.error(error);
      throw error;
    }
  };

  const bcTob2bCompanyFieldsMerged = [...bcTob2bCompanyInformation, ...bcTob2bCompanyExtraFields];

  const validateCompanyExtraFieldsUnique = async (data: CustomFieldItems) => {
    try {
      const extraCompanyInformation = bcTob2bCompanyFieldsMerged.filter(
        (item: RegisterFields) => !!item.custom,
      );
      const extraFields = extraCompanyInformation.map((field: RegisterFields) => ({
        fieldName: deCodeField(field.name),
        fieldValue: getRegisterFieldValueForBcToB2bFormValidation(field, data),
      }));

      const res = await validateBCCompanyExtraFields({
        extraFields,
      });

      if (res.code !== 200) {
        const message = res.data?.errMsg || res.message || '';

        const messageArr = message.split(':');

        if (messageArr.length >= 2) {
          const field = extraCompanyInformation.find((f) => deCodeField(f.name) === messageArr[0]);
          if (field) {
            setError(field.name, {
              type: 'manual',
              message: messageArr[1],
            });
            showLoading(false);
            return false;
          }
        }
        throw message;
      }

      setErrorMessage('');
      return true;
    } catch (error) {
      b2bLogger.error(error);
      throw error;
    }
  };

  const handleValidateAttachmentFiles = () => {
    const formData = getValues();
    const attachmentsFilesField = bcTob2bCompanyFieldsMerged.find(
      (info) => info.fieldId === 'field_attachments',
    );
    if (
      !isEmpty(attachmentsFilesField) &&
      attachmentsFilesField.required &&
      formData[attachmentsFilesField.name].length === 0
    ) {
      setError(attachmentsFilesField.name, {
        type: 'required',
        message: b3Lang('global.validate.required', {
          label: attachmentsFilesField.label ?? '',
        }),
      });

      showLoading(false);
      return true;
    }

    return false;
  };

  const handleResetBcTob2bContactInformation = (fieldName: string) => {
    if (bcTob2bContactInformation) {
      const newBcTob2bContactInformation = bcTob2bContactInformation.map(
        (contactInformationField) => {
          if (contactInformationField.name === fieldName) {
            return {
              ...contactInformationField,
              disabled: false,
            };
          }
          return contactInformationField;
        },
      );

      dispatch({
        type: 'all',
        payload: {
          bcTob2bContactInformation: [...newBcTob2bContactInformation],
        },
      });
    }
  };

  const handleValidateCompanyUserExtraFields = async (extraFields: CustomFieldItems[]) => {
    try {
      const res = await validateBCCompanyUserExtraFields({
        extraFields,
      });

      if (res.code !== 200) {
        const message = res.data?.errMsg || res.message || '';

        const messageArr = message.split(':');

        if (messageArr.length >= 2) {
          const field = bcTob2bContactInformation?.find(
            (f: RegisterFields) => f.custom && Base64.decode(f.name) === messageArr[0],
          );
          if (field) {
            setError(field.name, {
              type: 'manual',
              message: messageArr[1],
            });
            handleResetBcTob2bContactInformation(field.name);
            showLoading(false);
            return false;
          }
        }
        setErrorMessage(message);
        showLoading(false);
        return false;
      }
      setErrorMessage('');
      return true;
    } catch (error) {
      b2bLogger.error(error);
      return false;
    }
  };

  const handleNext = (event: MouseEvent) => {
    const hasAttachmentsFilesError = handleValidateAttachmentFiles();

    handleSubmit(async (data: CustomFieldItems) => {
      if (hasAttachmentsFilesError) return;
      showLoading(true);

      try {
        const isValidate = await validateCompanyExtraFieldsUnique(data);
        if (!isValidate) {
          return;
        }

        const getPayloadFieldValue = (field: RegisterFields) =>
          getRegisterFieldValueForBcToB2bForm(field, data);

        const companyUserExtraFields = buildCompanyUserExtraFieldsForBcToB2b(
          bcTob2bContactInformation ?? [],
          (field) => getRegisterFieldValueForBcToB2bFormValidation(field, data),
        );

        let isCompanyUserValidate = true;
        if (companyUserExtraFields.length > 0) {
          isCompanyUserValidate =
            await handleValidateCompanyUserExtraFields(companyUserExtraFields);
        }
        if (!isCompanyUserValidate) {
          return;
        }

        const attachmentsList = bcTob2bCompanyFieldsMerged.filter(
          (list) => list.fieldType === 'files',
        );
        const fileList = await getFileUrl(attachmentsList || [], data);

        let isAuto: boolean;
        if (isRegisterCompanyFlowEnabled) {
          const registerCompanyStatus = await submitBcToB2bRegisterCompany({
            data,
            customerDetails: {
              firstName: firstName ?? '',
              lastName: lastName ?? '',
              phone: phoneNumber,
            },
            contactList: bcTob2bContactInformation,
            companyInformation: bcTob2bCompanyFieldsMerged,
            addressBasicList: bcTob2bAddressBasicFields,
            fileList,
            genericRegistrationErrorMessage: b3Lang('global.error.genericMessage'),
          });
          isAuto = registerCompanyStatus === RegisterCompanyStatus.APPROVED;
        } else {
          const b2bFields = buildB2bCompanyCreatePayloadForBcToB2b({
            customerId,
            customerEmail: emailAddress,
            fileList,
            companyInformation: bcTob2bCompanyFieldsMerged,
            addressBasicList: bcTob2bAddressBasicFields,
            contactInformationList: bcTob2bContactInformation ?? [],
            getValue: getPayloadFieldValue,
            companyUserExtraFields,
          });
          await createB2BCompanyUser(b2bFields);
          isAuto = companyAutoApproval.enabled ?? false;
        }

        if (emailAddress) {
          dispatch({
            type: 'finishInfo',
            payload: {
              submitSuccess: true,
              isAutoApproval: isAuto,
              blockPendingAccountOrderCreation,
            },
          });
          dispatch({
            type: 'all',
            payload: {
              accountType: '1',
            },
          });
          await getCurrentCustomerInfo();
          onRegistrationSuccess();
        }
      } catch (err: unknown) {
        b2bLogger.error(err);
        let message: string;
        if (err instanceof Error) {
          message = err.message;
        } else if (typeof err === 'string') {
          message = err;
        } else {
          message = String(err);
        }
        setErrorMessage(message);
      } finally {
        showLoading(false);
      }
    })(event);
  };

  return {
    isMobile,
    errorMessage,
    bcTob2bContactInformation,
    bcTob2bCompanyInformation,
    bcTob2bCompanyExtraFields,
    bcTob2bAddressBasicFields,
    control,
    errors,
    getValues,
    setValue,
    setError,
    handleNext,
  };
}
