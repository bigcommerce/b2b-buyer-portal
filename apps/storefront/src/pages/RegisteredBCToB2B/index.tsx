import { MouseEvent, useContext, useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import { Alert, Box, ImageListItem } from '@mui/material';
import isEmpty from 'lodash-es/isEmpty';

import { B3Card } from '@/components/B3Card';
import { B3CustomForm } from '@/components/B3CustomForm';
import CustomButton from '@/components/button/CustomButton';
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';
import B3Spin from '@/components/spin/B3Spin';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { CustomStyleContext } from '@/shared/customStyleButton';
import { GlobalContext } from '@/shared/global';
import { useAppSelector } from '@/store';
import b2bLogger from '@/utils/b3Logger';
import { loginJump } from '@/utils/b3Login';
import { channelId, storeHash } from '@/utils/basicConfig';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';

import {
  createB2BCompanyUser,
  getB2BAccountFormFields,
  getB2BCountries,
  uploadB2BFile,
  validateBCCompanyExtraFields,
  validateBCCompanyUserExtraFields,
} from '../../shared/service/b2b';
import { type PageProps } from '../PageProps';
import {
  AccountFormFieldsItems,
  b2bAddressRequiredFields,
  Base64,
  Country,
  deCodeField,
  getAccountFormFields,
  RegisterFieldsItems,
  State,
  toHump,
} from '../Registered/config';
import { RegisteredContext, RegisteredProvider } from '../Registered/context/RegisteredContext';
import RegisteredFinish from '../Registered/RegisteredFinish';
import {
  InformationFourLabels,
  InformationLabels,
  RegisteredContainer,
  RegisteredImage,
  TipContent,
} from '../Registered/styled';
import { RegisterFields } from '../Registered/types';

type CustomerInfo = Record<string, string>;

const StyledRegisterContent = styled(Box)({
  '& #b3-customForm-id-name': {
    '& label[data-shrink="true"]': {
      whiteSpace: 'break-spaces',
      minWidth: 'calc(133% - 24px)',
      transition: 'unset',
    },

    '& label[data-shrink="false"]': {
      whiteSpace: 'break-spaces',
    },
  },
});

function RegisteredBCToB2B(props: PageProps) {
  const [errorMessage, setErrorMessage] = useState('');
  const [showFinishPage, setShowFinishPage] = useState<boolean>(false);

  const { setOpenPage } = props;

  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();

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
    state: { logo, blockPendingAccountOrderCreation, registerEnabled },
  } = useContext(GlobalContext);

  const navigate = useNavigate();

  const customer = useAppSelector(({ company }) => company.customer);
  const { id: customerId, firstName, lastName, emailAddress, phoneNumber } = customer;
  const { state, dispatch } = useContext(RegisteredContext);

  const {
    state: {
      companyAutoApproval,
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext);

  const customColor = getContrastColor(backgroundColor);

  const showLoading = (isShow = false) => {
    dispatch({
      type: 'loading',
      payload: {
        isLoading: isShow,
      },
    });
  };

  useEffect(() => {
    showLoading(false);

    if (!registerEnabled) {
      navigate('/login');
    }
    // disabling this rule as we don't need to add showLoading dispatcher and navigate fn into the dep array
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [registerEnabled]);

  useEffect(() => {
    const getBCAdditionalFields = async () => {
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
          accountFormAllFields.accountFormFields || []
        ).map((fields: AccountFormFieldsItems) => {
          const accountFields = fields;

          if (b2bAddressRequiredFields.includes(fields.fieldId || '') && fields.groupId === 4) {
            accountFields.isRequired = true;
            accountFields.visible = true;
          }

          return fields;
        });

        const bcToB2BAccountFormFields = getAccountFormFields(newAccountFormFields || []);
        const { countries } = await getB2BCountries();

        const newAddressInformationFields = bcToB2BAccountFormFields.address.map(
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
        );

        const customerInfo: CustomerInfo = {
          phone: phoneNumber,
          first_name: firstName,
          last_name: lastName,
          email: emailAddress,
        };

        const newContactInformation = bcToB2BAccountFormFields.contactInformation.map(
          (contactInformationField: Partial<RegisterFieldsItems>): Partial<RegisterFieldsItems> => {
            const field = contactInformationField;

            field.disabled = true;

            field.default =
              customerInfo[deCodeField(contactInformationField.name!)] ||
              contactInformationField.default;

            if (contactInformationField.required && !contactInformationField.default) {
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
              bcTob2bContactInformation: [...newContactInformation],
              bcTob2bCompanyExtraFields: [],
              bcTob2bCompanyInformation: [...bcToB2BAccountFormFields.businessDetails],
              bcTob2bAddressBasicFields: [...newAddressInformationFields],
              countryList: [...countries],
            },
          });
        }
      } catch (e) {
        b2bLogger.error(e);
      }
    };

    getBCAdditionalFields();
    // disabling as we only need to run this once and values at starting render are good enough
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const {
    bcTob2bContactInformation,
    isLoading,
    bcTob2bCompanyInformation = [],
    bcTob2bAddressBasicFields = [],
    countryList = [],
    bcTob2bCompanyExtraFields = [],
  } = state;

  useEffect(() => {
    const handleCountryChange = (countryCode: string, stateCode = '') => {
      const stateList =
        countryList.find(
          (country: Country) =>
            country.countryCode === countryCode || country.countryName === countryCode,
        )?.states || [];
      const stateFields = bcTob2bAddressBasicFields.find(
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
          (stateList.find((state: State) => state.stateCode === stateCode) ||
            stateList.length === 0)
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
    // disabling as we only need to run this when countryList changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [countryList]);

  const getFileUrl = async (attachmentsList: RegisterFields[], data: CustomFieldItems) => {
    let attachments: File[] = [];

    if (!attachmentsList.length) {
      return undefined;
    }

    attachmentsList.forEach((field: any) => {
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

      const fileList = fileResponse.reduce((fileList: any, res: any) => {
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
      }, []);

      return fileList;
    } catch (error) {
      b2bLogger.error(error);
      throw error;
    }
  };

  const getB2BFieldsValue = async (
    data: CustomFieldItems,
    customerId: number | string,
    fileList: any,
    companyUserExtraFields: CustomFieldItems[],
  ) => {
    const b2bFields: CustomFieldItems = {};

    b2bFields.customerId = customerId || '';
    b2bFields.storeHash = storeHash;
    b2bFields.userExtraFields = companyUserExtraFields;

    const companyInfo = bcTob2bCompanyInformation.filter(
      (list) => !list.custom && list.fieldType !== 'files',
    );
    const companyExtraInfo = bcTob2bCompanyInformation.filter((list) => Boolean(list.custom));

    // company field
    if (companyInfo.length) {
      companyInfo.forEach((item: any) => {
        b2bFields[toHump(deCodeField(item.name))] = data[item.name] || '';
      });
    }

    // Company Additional Field
    if (companyExtraInfo.length) {
      const extraFields: CustomFieldItems[] = [];

      companyExtraInfo.forEach((item: CustomFieldItems) => {
        const itemExtraField: CustomFieldItems = {};

        itemExtraField.fieldName = deCodeField(item.name);
        itemExtraField.fieldValue = data[item.name] || '';
        extraFields.push(itemExtraField);
      });
      b2bFields.extraFields = extraFields;
    }

    // address Field
    const addressBasicInfo = bcTob2bAddressBasicFields.filter((list) => !list.custom);
    const addressExtraBasicInfo = bcTob2bAddressBasicFields.filter((list) => Boolean(list.custom));

    if (addressBasicInfo.length) {
      addressBasicInfo.forEach((field: CustomFieldItems) => {
        const name = deCodeField(field.name);

        if (name === 'address1') {
          b2bFields.addressLine1 = data[field.name] || '';
        }

        if (name === 'address2') {
          b2bFields.addressLine2 = data[field.name] || '';
        }

        b2bFields[name] = data[field.name] || '';
      });
    }

    // address Additional Field
    if (addressExtraBasicInfo.length) {
      const extraFields: CustomFieldItems[] = [];

      addressExtraBasicInfo.forEach((item: CustomFieldItems) => {
        const itemExtraField: CustomFieldItems = {};

        itemExtraField.fieldName = deCodeField(item.name);
        itemExtraField.fieldValue = data[item.name] || '';
        extraFields.push(itemExtraField);
      });
      b2bFields.addressExtraFields = extraFields;
    }

    b2bFields.fileList = fileList;
    b2bFields.channelId = channelId;

    return createB2BCompanyUser(b2bFields);
  };

  const validateCompanyExtraFieldsUnique = async (data: CustomFieldItems) => {
    try {
      const extraCompanyInformation = bcTob2bCompanyInformation.filter((item: RegisterFields) =>
        Boolean(item.custom),
      );
      const extraFields = extraCompanyInformation.map((field: RegisterFields) => ({
        fieldName: deCodeField(field.name),
        fieldValue: data[field.name] || field.default,
      }));

      const res = await validateBCCompanyExtraFields({
        extraFields,
      });

      if (res.code !== 200) {
        const message = res.data?.errMsg || res.message || '';

        const messageArr = message.split(':');

        if (messageArr.length >= 2) {
          const field = extraCompanyInformation.find(
            (field) => deCodeField(field.name) === messageArr[0],
          );

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
    const attachmentsFilesFiled = bcTob2bCompanyInformation.find(
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

    return false;
  };

  const handleResetBcTob2bContactInformation = (FieldName: string) => {
    if (bcTob2bContactInformation) {
      const newBcTob2bContactInformation = bcTob2bContactInformation.map(
        (contactInformationField) => {
          if (contactInformationField.name === FieldName) {
            return {
              ...contactInformationField,
              disabled: false,
            };
          }

          return contactInformationField;
        },
      );

      if (dispatch) {
        dispatch({
          type: 'all',
          payload: {
            bcTob2bContactInformation: [...newBcTob2bContactInformation],
          },
        });
      }
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
            (field: RegisterFields) => field.custom && Base64.decode(field.name) === messageArr[0],
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
      return false;
    }
  };

  const handleNext = (event: MouseEvent) => {
    const hasAttachmentsFilesError = handleValidateAttachmentFiles();

    handleSubmit(async (data: CustomFieldItems) => {
      if (hasAttachmentsFilesError) {
        return;
      }

      showLoading(true);

      try {
        const isValidate = await validateCompanyExtraFieldsUnique(data);

        if (!isValidate) {
          return;
        }

        // get company user extra field
        const b2bContactInformationList = bcTob2bContactInformation || [];
        const companyUserExtraFieldsList = b2bContactInformationList.filter((item) =>
          Boolean(item.custom),
        );

        const companyUserExtraFields: CustomFieldItems[] = [];

        if (companyUserExtraFieldsList.length) {
          companyUserExtraFieldsList.forEach((item: CustomFieldItems) => {
            const itemExtraField: CustomFieldItems = {};

            itemExtraField.fieldName = deCodeField(item.name);
            itemExtraField.fieldValue = data[item.name] || item.default || '';
            companyUserExtraFields.push(itemExtraField);
          });
        }

        let isCompanyUserValidate = true;

        if (companyUserExtraFields.length > 0) {
          isCompanyUserValidate =
            await handleValidateCompanyUserExtraFields(companyUserExtraFields);
        }

        if (!isCompanyUserValidate) {
          return;
        }

        const attachmentsList = bcTob2bCompanyInformation.filter(
          (list) => list.fieldType === 'files',
        );
        const fileList = await getFileUrl(attachmentsList || [], data);

        await getB2BFieldsValue(data, customerId, fileList, companyUserExtraFields);

        const isAuto = companyAutoApproval.enabled;

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
          setShowFinishPage(true);
        }
      } catch (err: any) {
        b2bLogger.error(err);
        setErrorMessage(err?.message || err);
      } finally {
        showLoading(false);
      }
    })(event);
  };

  const handleFinish = () => {
    const isLoginLandLocation = loginJump(navigate, true);

    if (!isLoginLandLocation) {
      return;
    }

    if (companyAutoApproval.enabled) {
      navigate('/orders');
    } else {
      window.location.href = '/';
    }
  };

  return (
    <B3Card setOpenPage={setOpenPage}>
      <RegisteredContainer isMobile={isMobile}>
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
            {logo && (
              <RegisteredImage>
                <ImageListItem
                  onClick={() => {
                    window.location.href = '/';
                  }}
                  sx={{
                    maxWidth: '250px',
                  }}
                >
                  <img alt={b3Lang('global.tips.registerLogo')} loading="lazy" src={logo} />
                </ImageListItem>
              </RegisteredImage>
            )}

            {showFinishPage ? (
              <RegisteredFinish handleFinish={handleFinish} isBCToB2B />
            ) : (
              <StyledRegisterContent
                sx={{
                  width: isMobile ? '100%' : '537px',
                  boxShadow:
                    '0px 2px 1px -1px rgba(0, 0, 0, 0.2), 0px 1px 1px rgba(0, 0, 0, 0.14), 0px 1px 3px rgba(0, 0, 0, 0.12)',
                  borderRadius: '4px',
                  marginTop: '1rem',
                  background: '#FFFFFF',
                  padding: '0 0.8rem 1rem 0.8rem',
                }}
              >
                <InformationLabels>{b3Lang('registeredbctob2b.title')}</InformationLabels>

                {errorMessage && (
                  <Alert severity="error">
                    <TipContent>{errorMessage}</TipContent>
                  </Alert>
                )}

                <Box
                  sx={{
                    width: '100%',
                  }}
                >
                  <InformationFourLabels>
                    {bcTob2bContactInformation?.length
                      ? bcTob2bContactInformation[0]?.groupName
                      : ''}
                  </InformationFourLabels>
                  <B3CustomForm
                    control={control}
                    errors={errors}
                    formFields={bcTob2bContactInformation || []}
                    getValues={getValues}
                    setValue={setValue}
                  />
                </Box>

                <Box
                  sx={{
                    width: '100%',
                  }}
                >
                  <InformationFourLabels>
                    {bcTob2bCompanyInformation.length
                      ? bcTob2bCompanyInformation[0]?.groupName
                      : ''}
                  </InformationFourLabels>
                  <B3CustomForm
                    control={control}
                    errors={errors}
                    formFields={[...bcTob2bCompanyInformation, ...bcTob2bCompanyExtraFields]}
                    getValues={getValues}
                    setError={setError}
                    setValue={setValue}
                  />
                </Box>

                <Box
                  sx={{
                    width: '100%',
                  }}
                >
                  <InformationFourLabels>
                    {bcTob2bAddressBasicFields.length
                      ? bcTob2bAddressBasicFields[0]?.groupName
                      : ''}
                  </InformationFourLabels>

                  <B3CustomForm
                    control={control}
                    errors={errors}
                    formFields={bcTob2bAddressBasicFields}
                    getValues={getValues}
                    setValue={setValue}
                  />
                </Box>

                {!showFinishPage && (
                  <Box
                    sx={{
                      display: 'flex',
                      flexDirection: 'row-reverse',
                      pt: 2,
                      width: '100%',
                    }}
                  >
                    <CustomButton onClick={handleNext} variant="contained">
                      {b3Lang('global.button.submit')}
                    </CustomButton>
                  </Box>
                )}
              </StyledRegisterContent>
            )}
          </Box>
        </B3Spin>
      </RegisteredContainer>
    </B3Card>
  );
}

export default function RegisteredBCToB2BPage(props: PageProps) {
  return (
    <RegisteredProvider>
      <RegisteredBCToB2B {...props} />
    </RegisteredProvider>
  );
}
