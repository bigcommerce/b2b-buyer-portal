import { ChangeEvent, MouseEvent, useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import { Alert, Box, FormControl, FormControlLabel, Radio, RadioGroup } from '@mui/material';

import { B3CustomForm } from '@/components';
import { b3HexToRgb, getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { CustomStyleContext } from '@/shared/customStyleButton';
import {
  checkUserBCEmail,
  checkUserEmail,
  validateBCCompanyUserExtraFields,
} from '@/shared/service/b2b';
import { themeFrameSelector, useAppSelector } from '@/store';
import { channelId } from '@/utils';
import b2bLogger from '@/utils/b3Logger';

import { RegisteredContext } from './context/RegisteredContext';
import { Base64, emailError } from './config';
import { PrimaryButton } from './PrimaryButton';
import { InformationFourLabels, TipContent } from './styled';
import { RegisterFields } from './types';

interface RegisteredAccountProps {
  handleNext: (email: string) => void;
}

export default function RegisteredAccount({ handleNext }: RegisteredAccountProps) {
  const { state, dispatch } = useContext(RegisteredContext);
  const IframeDocument = useAppSelector(themeFrameSelector);

  const {
    state: {
      accountLoginRegistration,
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const customColor = getContrastColor(backgroundColor);

  const b3Lang = useB3Lang();

  const [errorTips, setErrorTips] = useState<string>('');

  const {
    contactInformation,
    accountType,
    additionalInformation,
    bcContactInformation,
    bcAdditionalInformation,
  } = state;

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setError,
    setValue,
  } = useForm({
    mode: 'onSubmit',
  });

  const additionName = accountType === '1' ? 'additionalInformation' : 'bcAdditionalInformation';
  const additionalInfo: any =
    accountType === '1' ? additionalInformation || [] : bcAdditionalInformation || [];

  const newContactInformation = contactInformation?.map((contactInfo: CustomFieldItems) => {
    const info = contactInfo;
    if (contactInfo.fieldId === 'field_email' && accountType === '1') {
      info.isTip = true;
      info.tipText = 'This email will be used to sign in to your account';
    }

    return contactInfo;
  });

  const contactInfo: any = accountType === '1' ? newContactInformation : bcContactInformation || [];
  const contactName = accountType === '1' ? 'contactInformation' : 'bcContactInformationFields';

  const contactInformationLabel = contactInfo.length ? contactInfo[0]?.groupName : '';

  const additionalInformationLabel = additionalInfo.length ? additionalInfo[0]?.groupName : '';

  const showLoading = (isShow = false) => {
    dispatch({
      type: 'loading',
      payload: {
        isLoading: isShow,
      },
    });
  };

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'accountType',
      payload: {
        accountType: event.target.value,
      },
    });
  };

  const emailName =
    contactInformation?.find((item: CustomFieldItems) => item.fieldId === 'field_email')?.name ||
    'email';

  const validateEmailValue = async (email: string) => {
    const isRegisterAsB2BUser = accountType === '1';
    try {
      showLoading(true);
      const {
        isValid,
        userType,
        userInfo: { companyName = '' } = {},
      } = isRegisterAsB2BUser
        ? await checkUserEmail({ email, channelId })
        : await checkUserBCEmail({ email, channelId });

      if (!isValid) {
        setErrorTips(
          b3Lang(emailError[userType], {
            companyName: companyName || '',
            email,
          }),
        );
        setError(emailName, {
          type: 'custom',
          message: '',
        });

        IframeDocument?.body.scrollIntoView(true);
      } else {
        setErrorTips('');
      }

      return isValid;
    } catch (error) {
      return false;
    } finally {
      showLoading(false);
    }
  };

  const handleAccountToDetail = async (event: MouseEvent) => {
    handleSubmit(async (data: CustomFieldItems) => {
      if (!(await validateEmailValue(data[emailName]))) {
        return;
      }

      const newContactInfo = contactInfo.map((item: RegisterFields) => {
        const newContactItem = item;
        newContactItem.default = data[item.name] || item.default;
        if (item.fieldId === 'field_email_marketing_newsletter' && item.fieldType === 'checkbox') {
          newContactItem.isChecked = data[item.name].length > 0;
        }
        return item;
      });

      try {
        showLoading(true);
        if (accountType === '1') {
          const extraCompanyUserInformation = newContactInfo.filter(
            (item: RegisterFields) => !!item.custom,
          );
          const extraFields = extraCompanyUserInformation.map((field: RegisterFields) => ({
            fieldName: Base64.decode(field.name),
            fieldValue: data[field.name] || field.default,
          }));
          if (extraFields.length > 0) {
            const res = await validateBCCompanyUserExtraFields({
              extraFields,
            });

            if (res.code !== 200) {
              const message = res.data?.errMsg || res.message || '';

              const messageArr = message.split(':');

              if (messageArr.length >= 2) {
                const field = extraCompanyUserInformation.find(
                  (field: RegisterFields) => Base64.decode(field.name) === messageArr[0],
                );
                if (field) {
                  setError(field.name, {
                    type: 'manual',
                    message: messageArr[1],
                  });
                  showLoading(false);
                  return;
                }
              }
              setErrorTips(message);
              showLoading(false);
              return;
            }
          }
          setErrorTips('');
        }
      } catch (error) {
        b2bLogger.error(error);
      } finally {
        showLoading(false);
      }

      let newAdditionalInformation: Array<RegisterFields> = [];
      if (additionalInfo) {
        newAdditionalInformation = (additionalInfo as Array<RegisterFields>).map(
          (item: RegisterFields) => {
            const additionalInfoItem = item;
            additionalInfoItem.default = data[item.name] || item.default;
            return item;
          },
        );
      }

      dispatch({
        type: 'all',
        payload: {
          [additionName]: [...newAdditionalInformation],
          [contactName]: [...newContactInfo],
        },
      });
      handleNext(data[emailName]);
    })(event);
  };

  return (
    <Box
      sx={{
        pl: 1,
        pr: 1,
        mt: 2,
        width: '100%',
      }}
    >
      {errorTips && (
        <Alert severity="error">
          <TipContent>{errorTips}</TipContent>
        </Alert>
      )}
      <FormControl
        sx={{
          '& h4': {
            color: customColor,
          },
        }}
      >
        <InformationFourLabels>
          {b3Lang('register.registeredAccount.accountType')}
        </InformationFourLabels>
        <RadioGroup
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          value={accountType}
          onChange={handleChange}
          sx={{
            '& .MuiTypography-root.MuiTypography-body1.MuiFormControlLabel-label': {
              color: b3HexToRgb(customColor, 0.87),
            },
            '& .MuiButtonBase-root.MuiRadio-root.MuiRadio-colorPrimary:not(.Mui-checked)': {
              color: b3HexToRgb(customColor, 0.6),
            },
          }}
        >
          {accountLoginRegistration.b2b && (
            <FormControlLabel
              value="1"
              control={<Radio />}
              label={b3Lang('register.registeredAccount.businessAccount')}
            />
          )}
          {accountLoginRegistration.b2c && (
            <FormControlLabel
              value="2"
              control={<Radio />}
              label={b3Lang('register.registeredAccount.personalAccount')}
            />
          )}
        </RadioGroup>
      </FormControl>
      <Box
        sx={{
          '& h4': {
            color: customColor,
          },
          '& input, & .MuiFormControl-root .MuiTextField-root, & .MuiTextField-root .MuiInputBase-multiline':
            {
              borderRadius: '4px',
              borderBottomLeftRadius: '0',
              borderBottomRightRadius: '0',
            },
          '& .MuiButtonBase-root.MuiCheckbox-root.MuiCheckbox-colorPrimary:not(.Mui-checked)': {
            color: b3HexToRgb(customColor, 0.6),
          },
          '& .MuiTypography-root.MuiTypography-body1.MuiFormControlLabel-label': {
            color: b3HexToRgb(customColor, 0.87),
          },
        }}
      >
        <InformationFourLabels>{contactInformationLabel}</InformationFourLabels>
        <B3CustomForm
          formFields={contactInfo}
          errors={errors}
          control={control}
          getValues={getValues}
          setValue={setValue}
        />
      </Box>
      <Box />
      {additionalInfo && additionalInfo.length ? (
        <Box
          sx={{
            '& h4': {
              color: customColor,
            },
            '& .MuiFormControlLabel-label, & .MuiFormControl-root .MuiFormLabel-root:not(.Mui-focused)':
              {
                color: b3HexToRgb(customColor, 0.87),
              },
            '& .MuiRadio-root:not(.Mui-checked)': {
              color: b3HexToRgb(customColor, 0.6),
            },
          }}
        >
          <InformationFourLabels>{additionalInformationLabel}</InformationFourLabels>
          <B3CustomForm
            formFields={additionalInfo}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
        </Box>
      ) : (
        ''
      )}

      <Box
        sx={{
          display: 'flex',
          justifyContent: 'flex-end',
          pt: 2,
        }}
      >
        <PrimaryButton onClick={handleAccountToDetail}>
          {b3Lang('global.button.next')}
        </PrimaryButton>
      </Box>
    </Box>
  );
}
