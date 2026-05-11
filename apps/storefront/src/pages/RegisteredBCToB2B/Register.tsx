import { useCallback, useContext, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box } from '@mui/material';

import { B3Card } from '@/components/B3Card';
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import B3Spin from '@/components/spin/B3Spin';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { useAppSelector } from '@/store';
import b2bLogger from '@/utils/b3Logger';
import { loginJump } from '@/utils/b3Login';
import {
  AccountFormFieldsItems,
  deCodeField,
  getAccountFormFields,
  RegisterFieldsItems,
} from '@/utils/registerUtils';

import { getB2BAccountFormFields, getB2BCountries } from '../../shared/service/b2b';
import { type PageProps } from '../PageProps';
import { b2bAddressRequiredFields } from '../Registered/config';
import { RegisteredContext } from '../Registered/Context';
import FinishStep from '../Registered/RegisterSteps/steps/FinishStep';
import { RegisterFields } from '../Registered/types';

import { Logo } from './Logo';
import RegistrationForm from './RegistrationForm';

interface CustomerInfo {
  [k: string]: string;
}

interface RegisterProps extends PageProps {
  logo: string;
}

export function Register({ logo, ...props }: RegisterProps) {
  const [showFinishPage, setShowFinishPage] = useState<boolean>(false);

  const { setOpenPage } = props;

  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();

  const navigate = useNavigate();

  const customer = useAppSelector(({ company }) => company.customer);
  const { firstName, lastName, emailAddress, phoneNumber } = customer;
  const { state, dispatch } = useContext(RegisteredContext);

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const customColor = getContrastColor(backgroundColor);

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

  const getBCAdditionalFields = useCallback(async () => {
    try {
      if (dispatch) {
        showLoading(true);
        dispatch({
          type: 'finishInfo',
          payload: {
            submitSuccess: false,
          },
        });
      }

      const accountFormAllFields = await getB2BAccountFormFields(3);

      const newAccountFormFields: AccountFormFieldsItems[] = (
        accountFormAllFields?.accountFormFields || []
      ).map((fields: AccountFormFieldsItems) => {
        if (b2bAddressRequiredFields.includes(fields?.fieldId || '') && fields.groupId === 4) {
          return { ...fields, isRequired: true, visible: true };
        }
        return fields;
      });

      const bcToB2BAccountFormFields = getAccountFormFields(newAccountFormFields || []);
      const { countries } = await getB2BCountries();

      const newAddressInformationFields = (bcToB2BAccountFormFields.address ?? []).map(
        (addressFields: Partial<RegisterFieldsItems>): Partial<RegisterFieldsItems> => {
          if (addressFields.name === 'country') {
            return {
              ...addressFields,
              options: countries,
              replaceOptions: {
                label: 'countryName',
                value: 'countryName',
              },
            };
          }
          return addressFields;
        },
      );

      const customerInfo: CustomerInfo = {
        phone: phoneNumber,
        first_name: firstName,
        last_name: lastName,
        email: emailAddress,
      };

      const newContactInformation = (bcToB2BAccountFormFields.contactInformation ?? []).map(
        (contactInformationField: Partial<RegisterFieldsItems>): Partial<RegisterFieldsItems> => {
          const field = contactInformationField;
          field.disabled = true;

          field.default =
            customerInfo[deCodeField(contactInformationField.name as string)] ||
            contactInformationField.default;

          if (contactInformationField.required && !contactInformationField?.default) {
            field.disabled = false;
          }

          return contactInformationField;
        },
      );

      if (dispatch) {
        dispatch({
          type: 'all',
          payload: {
            isLoading: false,
            bcTob2bContactInformation: [...newContactInformation] as RegisterFields[],
            bcTob2bCompanyExtraFields: [],
            bcTob2bCompanyInformation: [
              ...(bcToB2BAccountFormFields.businessDetails ?? []),
            ] as RegisterFields[],
            bcTob2bAddressBasicFields: [...newAddressInformationFields] as RegisterFields[],
            countryList: [...countries],
          },
        });
      }
    } catch (e) {
      b2bLogger.error(e);
    } finally {
      showLoading(false);
    }
  }, [dispatch, emailAddress, firstName, lastName, phoneNumber, showLoading]);

  useEffect(() => {
    getBCAdditionalFields();
  }, [getBCAdditionalFields]);

  const { isLoading } = state;

  const handleFinish = (shouldAutoLogin: boolean) => {
    const isLoginLandLocation = loginJump(navigate, true);

    if (!isLoginLandLocation) return;

    if (shouldAutoLogin) {
      navigate('/orders');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <B3Card setOpenPage={setOpenPage}>
      <Box sx={isMobile ? undefined : { padding: '20px 40px' }}>
        <B3Spin isSpinning={isLoading} tip={b3Lang('global.tips.loading')} transparency="0">
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              alignItems: 'center',
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
            {logo && <Logo logoUrl={logo} logoAlt={b3Lang('global.tips.registerLogo')} />}

            {showFinishPage ? (
              <FinishStep handleFinish={handleFinish} isBCToB2B />
            ) : (
              <RegistrationForm onRegistrationSuccess={() => setShowFinishPage(true)} />
            )}
          </Box>
        </B3Spin>
      </Box>
    </B3Card>
  );
}
