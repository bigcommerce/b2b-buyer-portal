import { MouseEvent, useCallback, useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import { Alert, Box } from '@mui/material';
import isEmpty from 'lodash-es/isEmpty';

import { B3CustomForm } from '@/components';
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { CustomStyleContext } from '@/shared/customStyleButton';

import { RegisteredContext } from './context/RegisteredContext';
import { Country, State, validateExtraFields } from './config';
import { PrimaryButton } from './PrimaryButton';
import { InformationFourLabels, TipContent } from './styled';
import { RegisterFields } from './types';

interface RegisteredDetailProps {
  handleBack: () => void;
  handleNext: () => void;
}

export default function RegisteredDetail({ handleBack, handleNext }: RegisteredDetailProps) {
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

  const setRegisterFieldsValue = (formFields: Array<RegisterFields>, formData: CustomFieldItems) =>
    formFields.map((field) => {
      const item = field;
      item.default = formData[field.name] || field.default;
      return field;
    });

  interface DetailsFormValues {
    [K: string]: string | number | boolean;
  }

  const saveDetailsData = () => {
    const data = [...companyInformation, ...companyAttachment, ...addressBasicList].reduce(
      (formValues: DetailsFormValues, field: RegisterFields) => {
        const values = formValues;
        values[field.name] = getValues(field.name) || field.default;

        return formValues;
      },
      {},
    );

    const newCompanyInformation = setRegisterFieldsValue(companyInformation, data);
    const newCompanyAttachment = setRegisterFieldsValue(companyAttachment, data);
    const newAddressBasicFields = setRegisterFieldsValue(addressBasicList, data);

    dispatch({
      type: 'all',
      payload: {
        companyInformation: [...newCompanyInformation],
        companyAttachment: [...newCompanyAttachment],
        [addressBasicName]: [...newAddressBasicFields],
      },
    });
  };

  const handleValidateAttachmentFiles = () => {
    if (accountType === '1') {
      const formData = getValues();
      const attachmentsFilesFiled = companyInformation.find(
        (info) => info.fieldId === 'field_attachments',
      );
      if (
        !isEmpty(attachmentsFilesFiled) &&
        attachmentsFilesFiled.required &&
        formData[attachmentsFilesFiled.name].length === 0
      ) {
        setError(attachmentsFilesFiled.name, {
          type: 'required',
          message: b3Lang('global.validate.required', {
            label: attachmentsFilesFiled.label ?? '',
          }),
        });

        showLoading(false);
        return true;
      }
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
