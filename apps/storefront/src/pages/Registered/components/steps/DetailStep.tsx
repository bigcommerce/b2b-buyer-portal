import { MouseEvent, useCallback, useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Box } from '@mui/material';

import { B3CustomForm } from '@/components/B3CustomForm';
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';

import { RegisteredContext } from '../../context/RegisteredContext';
import { InformationFourLabels, TipContent } from '../../styled';
import { Country, RegisterFields, State } from '../../types';
import {
  buildDetailsFormValues,
  setRegisterFieldsFromFormData,
  validateAttachmentsRequired,
  validateExtraFields,
} from '../../utils';
import { PrimaryButton } from '../PrimaryButton';

interface DetailStepProps {
  handleBack: () => void;
  handleNext: () => void;
}

export default function DetailStep({ handleBack, handleNext }: DetailStepProps) {
  const b3Lang = useB3Lang();

  const { state, dispatch } = useContext(RegisteredContext);

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const customColor = getContrastColor(backgroundColor);

  const [errorMessage, setErrorMessage] = useState('');

  const {
    accountType = '1',
    companyInformation = [],
    companyAttachment = [],
    addressBasicFields = [],
    bcAddressBasicFields = [],
    countryList = [],
  } = state;

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
    watch,
    setError,
  } = useForm({
    mode: 'all',
  });
  const businessDetailsName = accountType === '1' ? companyInformation[0]?.groupName : '';

  const addressBasicName = accountType === '1' ? 'addressBasicFields' : 'bcAddressBasicFields';
  const addressBasicList = accountType === '1' ? addressBasicFields : bcAddressBasicFields;

  const addressName = addressBasicList[0]?.groupName || '';

  const handleCountryChange = useCallback(
    (countryCode: string, stateCode = '') => {
      const stateList =
        countryList.find(
          (country: Country) =>
            country.countryCode === countryCode || country.countryName === countryCode,
        )?.states || [];
      const stateFields = addressBasicList.find(
        (formFields: RegisterFields) => formFields.name === 'state',
      );

      if (stateFields) {
        if (stateList.length > 0) {
          stateFields.fieldType = 'dropdown';
          stateFields.options = stateList;
          stateFields.required = true;
        } else {
          stateFields.fieldType = 'text';
          stateFields.options = [];
          stateFields.required = false;
        }
      }

      setValue(
        'state',
        stateCode &&
          countryCode &&
          (stateList.find((state: State) => state.stateName === stateCode) ||
            stateList.length === 0)
          ? stateCode
          : '',
      );

      dispatch({
        type: 'stateList',
        payload: {
          stateList,
          addressBasicFields,
          bcAddressBasicFields,
          [addressBasicName]: [...addressBasicList],
        },
      });
    },
    // disabling as we don't need dispatchers here
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [addressBasicFields, addressBasicList, addressBasicName, bcAddressBasicFields, countryList],
  );

  useEffect(() => {
    const countryValue = getValues('country');
    const stateValue = getValues('state');
    handleCountryChange(countryValue, stateValue);
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const { country, state } = value;

      if (name === 'country' && type === 'change') {
        handleCountryChange(country, state);
      }
    });
    return () => subscription.unsubscribe();
    // disabling as we don't need watch in the dependency array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryList, handleCountryChange]);

  const showLoading = (isShow = false) => {
    dispatch({
      type: 'loading',
      payload: {
        isLoading: isShow,
      },
    });
  };

  const saveDetailsData = () => {
    const allFields = [...companyInformation, ...companyAttachment, ...addressBasicList];
    const data = buildDetailsFormValues(allFields, (name) => getValues(name));

    const newCompanyInformation = setRegisterFieldsFromFormData(companyInformation, data);
    const newCompanyAttachment = setRegisterFieldsFromFormData(companyAttachment, data);
    const newAddressBasicFields = setRegisterFieldsFromFormData(addressBasicList, data);

    dispatch({
      type: 'all',
      payload: {
        companyInformation: [...newCompanyInformation],
        companyAttachment: [...newCompanyAttachment],
        [addressBasicName]: [...newAddressBasicFields],
      },
    });
  };

  const handleValidateAttachmentFiles = (): boolean => {
    const formData = getValues() as Record<string, unknown>;
    const result = validateAttachmentsRequired(accountType, companyInformation, formData);
    if (result.hasError && result.field) {
      setError(result.field.name, {
        type: 'required',
        message: b3Lang('global.validate.required', {
          label: result.field.label ?? '',
        }),
      });
      showLoading(false);
      return true;
    }
    return false;
  };

  const handleAccountToFinish = (event: MouseEvent) => {
    const hasAttachmentsFilesError = handleValidateAttachmentFiles();

    handleSubmit(async (data: CustomFieldItems) => {
      if (hasAttachmentsFilesError) return;
      showLoading(true);
      try {
        if (accountType === '1') {
          await Promise.all([
            validateExtraFields({
              fields: companyInformation,
              data,
              type: 'company',
              setError,
            }),
            validateExtraFields({
              fields: addressBasicFields,
              data,
              type: 'address',
              setError,
            }),
          ]);

          setErrorMessage('');
        }

        saveDetailsData();

        showLoading(false);
        handleNext();
      } catch (error) {
        if (typeof error === 'string') {
          setErrorMessage(error);
        }
        showLoading(false);
      }
    })(event);
  };

  const handleBackAccount = () => {
    saveDetailsData();

    handleBack();
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
        '& input, & .MuiFormControl-root .MuiTextField-root, & .MuiDropzoneArea-textContainer, & .MuiSelect-select.MuiSelect-filled, & .MuiTextField-root .MuiInputBase-multiline':
          {
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
      {accountType === '1' ? (
        <Box>
          <InformationFourLabels>{businessDetailsName}</InformationFourLabels>
          <B3CustomForm
            formFields={[...companyInformation]}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
            setError={setError}
          />
        </Box>
      ) : null}

      <Box>
        <InformationFourLabels>{addressName}</InformationFourLabels>

        <B3CustomForm
          formFields={addressBasicList}
          errors={errors}
          control={control}
          getValues={getValues}
          setValue={setValue}
        />
      </Box>

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          pt: 2,
          gap: 1,
        }}
      >
        <PrimaryButton onClick={handleBackAccount}>{b3Lang('global.button.back')}</PrimaryButton>
        <PrimaryButton onClick={handleAccountToFinish}>
          {b3Lang('global.button.next')}
        </PrimaryButton>
      </Box>
    </Box>
  );
}
