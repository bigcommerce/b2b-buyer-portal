import { useContext, useEffect, useState } from 'react';

import { useB3Lang } from '@/lib/lang';
import { LoginConfig } from '@/pages/Login/helper';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import { getB2BAccountFormFields, getB2BCountries } from '@/shared/service/b2b';
import { themeFrameSelector, useAppSelector } from '@/store';
import b2bLogger from '@/utils/b3Logger';
import {
  AccountFormFieldsItems,
  getAccountFormFields,
  RegisterFieldsItems,
} from '@/utils/registerUtils';
import { getStoreConfigs } from '@/utils/storefrontConfig';

import { b2bAddressRequiredFields, companyAttachmentsFields } from '../config';
import { RegisteredContext } from '../Context';
import { RegisterFields } from '../types';

import RegisterContent from './RegisterContent';
import RegisterStep from './RegisterStep';

// 1 bc 2 b2b
const formType: Array<number> = [1, 2];

interface RegisterStepsProps {
  backgroundColor: string;
  handleFinish: (config: LoginConfig) => void;
}

export function RegisterSteps({ backgroundColor, handleFinish }: RegisterStepsProps) {
  const b3Lang = useB3Lang();
  const [activeStep, setActiveStep] = useState(0);

  const IframeDocument = useAppSelector(themeFrameSelector);

  const {
    state: { accountLoginRegistration },
    dispatch: styleDispatch,
  } = useContext(CustomStyleContext);

  const { dispatch: globalDispatch } = useContext(GlobalContext);

  const { dispatch } = useContext(RegisteredContext);

  useEffect(() => {
    const loadRegistrationFormFields = async () => {
      try {
        if (dispatch) {
          dispatch({
            type: 'loading',
            payload: {
              isLoading: true,
            },
          });
          dispatch({
            type: 'finishInfo',
            payload: {
              submitSuccess: false,
            },
          });
        }

        getStoreConfigs(styleDispatch, globalDispatch);

        const accountFormAllFields = formType.map((item: number) => getB2BAccountFormFields(item));

        const accountFormFields = await Promise.all(accountFormAllFields);

        const newB2bAccountFormFields: AccountFormFieldsItems[] = (
          accountFormFields[1]?.accountFormFields || []
        ).map((fields: AccountFormFieldsItems) => {
          const formFields = fields;
          if (b2bAddressRequiredFields.includes(fields?.fieldId || '') && fields.groupId === 4) {
            formFields.isRequired = true;
            formFields.visible = true;
          }

          return fields;
        });

        const bcAccountFormFields = getAccountFormFields(
          accountFormFields[0]?.accountFormFields || [],
        );
        const b2bAccountFormFields = getAccountFormFields(newB2bAccountFormFields || []);

        const { countries } = await getB2BCountries();

        const newAddressInformationFields =
          b2bAccountFormFields.address?.map(
            (addressFields: Partial<RegisterFieldsItems>): Partial<RegisterFieldsItems> => {
              const fields = addressFields;
              if (addressFields.name === 'country') {
                fields.options = countries;
                fields.replaceOptions = {
                  label: 'countryName',
                  value: 'countryName',
                };
              }
              return addressFields;
            },
          ) || [];

        const newBCAddressInformationFields =
          bcAccountFormFields.address?.map(
            (addressFields: Partial<RegisterFieldsItems>): Partial<RegisterFieldsItems> => {
              const addressFormFields = addressFields;
              if (addressFields.name === 'country') {
                addressFormFields.options = countries;
                const countryDefaultValue = countries.find(
                  (country: CustomFieldItems) => country.countryName === addressFields.default,
                );
                addressFormFields.default =
                  countryDefaultValue?.countryCode || addressFields.default;
              }
              return addressFields;
            },
          ) || [];

        const { b2b, b2c } = accountLoginRegistration;
        const accountB2cEnabledInfo = b2c && !b2b;
        if (dispatch) {
          dispatch({
            type: 'all',
            payload: {
              accountType: accountB2cEnabledInfo ? '2' : '1',
              isLoading: false,
              contactInformation: [
                ...(b2bAccountFormFields.contactInformation || []),
              ] as RegisterFields[],
              bcContactInformation: [
                ...(bcAccountFormFields.contactInformation || []),
              ] as RegisterFields[],
              additionalInformation: [
                ...(b2bAccountFormFields.additionalInformation || []),
              ] as RegisterFields[],
              bcAdditionalInformation: [
                ...(bcAccountFormFields.additionalInformation || []),
              ] as RegisterFields[],
              companyExtraFields: [],
              companyInformation: [
                ...(b2bAccountFormFields?.businessDetails || []),
              ] as RegisterFields[],
              companyAttachment: [...companyAttachmentsFields(b3Lang)],
              addressBasicFields: [...newAddressInformationFields] as RegisterFields[],
              bcAddressBasicFields: [...newBCAddressInformationFields] as RegisterFields[],
              countryList: [...countries],
              passwordInformation: [...(b2bAccountFormFields.password || [])] as RegisterFields[],
              bcPasswordInformation: [...(bcAccountFormFields.password || [])] as RegisterFields[],
            },
          });
        }
      } catch (e) {
        b2bLogger.error(e);
      }
    };

    loadRegistrationFormFields();
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    IframeDocument?.body.scrollIntoView(true);
    // disabling as we only need to run this when activeStep changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeStep]);

  const handleNext = () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1);
  };

  const handleBack = () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1);
  };

  return (
    <RegisterStep activeStep={activeStep} backgroundColor={backgroundColor}>
      <RegisterContent
        activeStep={activeStep}
        handleBack={handleBack}
        handleNext={handleNext}
        handleFinish={handleFinish}
      />
    </RegisterStep>
  );
}
