import { ChangeEvent, MouseEvent, useContext, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Alert, Box, FormControl, FormControlLabel, Radio, RadioGroup } from '@mui/material';

import { B3CustomForm } from '@/components/B3CustomForm';
import { b3HexToRgb, getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import {
  checkUserBCEmail,
  checkUserEmail,
  validateBCCompanyUserExtraFields,
} from '@/shared/service/b2b';
import { themeFrameSelector, useAppSelector } from '@/store';
import b2bLogger from '@/utils/b3Logger';
import { Base64 } from '@/utils/base64';
import { channelId } from '@/utils/basicConfig';

import { RegisteredContext } from '../../context/RegisteredContext';
import { InformationFourLabels, TipContent } from '../../styled';
import { RegisterFields } from '../../types';
import {
  applyContactEmailTip,
  emailError,
  getEmailFieldName,
  mergeContactInfoWithFormData,
  setRegisterFieldsFromFormData,
} from '../../utils';
import { PrimaryButton } from '../PrimaryButton';

interface AccountStepProps {
  handleNext: (email: string) => void;
}

export default function AccountStep({ handleNext }: AccountStepProps) {
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
  const additionalInfo =
    accountType === '1' ? (additionalInformation ?? []) : (bcAdditionalInformation ?? []);

  const contactInfo =
    accountType === '1'
      ? applyContactEmailTip(contactInformation, accountType, b3Lang('register.tip.emailSignIn'))
      : (bcContactInformation ?? []);
  const contactName = accountType === '1' ? 'contactInformation' : 'bcContactInformation';

  const contactInformationLabel = contactInfo.length ? contactInfo[0]?.groupName : '';
  const additionalInformationLabel = additionalInfo.length ? additionalInfo[0]?.groupName : '';
  const emailName = getEmailFieldName(contactInformation);

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

      const newContactInfo = mergeContactInfoWithFormData(contactInfo, data);

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

      const newAdditionalInformation = setRegisterFieldsFromFormData(additionalInfo, data);

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
