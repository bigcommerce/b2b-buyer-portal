import {
  Dispatch,
  MouseEvent,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import type { OpenPageState } from '@b3/hooks'
import { useB3Lang } from '@b3/lang'
import { Alert, Box, ImageListItem } from '@mui/material'

import { B3Card, B3CustomForm, B3Sping, CustomButton } from '@/components'
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles'
import { useMobile } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import {
  convertLabel,
  getCurrentCustomerInfo,
  manipulateString,
  storeHash,
} from '@/utils'

import {
  createB2BCompanyUser,
  getB2BAccountFormFields,
  getB2BCountries,
  uploadB2BFile,
  validateBCCompanyExtraFields,
} from '../../shared/service/b2b'

import { RegisteredContext } from './context/RegisteredContext'
import {
  AccountFormFieldsItems,
  b2bAddressRequiredFields,
  Country,
  deCodeField,
  getAccountFormFields,
  RegisterFields,
  RegisterFieldsItems,
  State,
  steps,
  toHump,
} from './config'
import RegisteredFinish from './RegisteredFinish'
import {
  InformationFourLabels,
  InformationLabels,
  RegisteredContainer,
  RegisteredImage,
  TipContent,
} from './styled'

interface CustomerInfo {
  [k: string]: string
}

interface RegisteredProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

export default function RegisteredBCToB2B(props: RegisteredProps) {
  const [errorMessage, setErrorMessage] = useState('')
  const [showFinishPage, setShowFinishPage] = useState<boolean>(false)

  const { setOpenPage } = props

  const b3Lang = useB3Lang()
  const [isMobile] = useMobile()

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
  })

  const {
    state: {
      customerId,
      customer: {
        phoneNumber = '',
        firstName = '',
        lastName = '',
        emailAddress = '',
      } = {},
      storeName,
      logo,
      currentChannelId: channelId,
      blockPendingAccountOrderCreation,
      registerEnabled,
    },
    dispatch: globalDispatch,
  } = useContext(GlobaledContext)

  const navigate = useNavigate()

  const { state, dispatch } = useContext(RegisteredContext)

  const {
    state: {
      companyAutoApproval,
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)

  const customColor = getContrastColor(backgroundColor)

  const showLoading = (isShow = false) => {
    dispatch({
      type: 'loading',
      payload: {
        isLoading: isShow,
      },
    })
  }

  useEffect(() => {
    showLoading(false)
    if (!registerEnabled) {
      navigate('/login')
    }
  }, [registerEnabled])

  useEffect(() => {
    const getBCAdditionalFields = async () => {
      try {
        if (dispatch) {
          showLoading(true)
          dispatch({
            type: 'finishInfo',
            payload: {
              submitSuccess: false,
            },
          })
        }

        const accountFormAllFields = await getB2BAccountFormFields(3)

        const newAccountFormFields: AccountFormFieldsItems[] = (
          accountFormAllFields?.accountFormFields || []
        ).map((fields: AccountFormFieldsItems) => {
          if (
            b2bAddressRequiredFields.includes(fields?.fieldId || '') &&
            fields.groupId === 4
          ) {
            fields.isRequired = true
            fields.visible = true
          }

          return fields
        })

        const bcToB2BAccountFormFields = getAccountFormFields(
          newAccountFormFields || []
        )
        const { countries } = await getB2BCountries()

        const newAddressInformationFields =
          bcToB2BAccountFormFields.address.map(
            (
              addressFields: Partial<RegisterFieldsItems>
            ): Partial<RegisterFieldsItems> => {
              if (addressFields.name === 'country') {
                addressFields.options = countries
                addressFields.replaceOptions = {
                  label: 'countryName',
                  value: 'countryName',
                }
              }
              return addressFields
            }
          )

        const customerInfo: CustomerInfo = {
          phone: phoneNumber,
          first_name: firstName,
          last_name: lastName,
          email: emailAddress,
        }

        const newContactInformation =
          bcToB2BAccountFormFields.contactInformation.map(
            (
              contactInformationField: Partial<RegisterFieldsItems>
            ): Partial<RegisterFieldsItems> => {
              contactInformationField.disabled = true

              contactInformationField.default =
                customerInfo[
                  deCodeField(contactInformationField.name as string)
                ] || contactInformationField.default

              return contactInformationField
            }
          )

        if (dispatch) {
          dispatch({
            type: 'all',
            payload: {
              isLoading: false,
              storeName,
              bcTob2bContactInformation: [...newContactInformation],
              bcTob2bCompanyExtraFields: [],
              bcTob2bCompanyInformation: [
                ...bcToB2BAccountFormFields.businessDetails,
              ],
              bcTob2bAddressBasicFields: [...newAddressInformationFields],
              countryList: [...countries],
            },
          })
        }
      } catch (e) {
        console.error(e)
      }
    }

    getBCAdditionalFields()
  }, [])

  const {
    bcTob2bContactInformation,
    isLoading,
    bcTob2bCompanyInformation = [],
    bcTob2bAddressBasicFields = [],
    countryList = [],
    bcTob2bCompanyExtraFields = [],
  } = state

  const handleCountryChange = (countryCode: string, stateCode = '') => {
    const stateList =
      countryList.find(
        (country: Country) =>
          country.countryCode === countryCode ||
          country.countryName === countryCode
      )?.states || []
    const stateFields = bcTob2bAddressBasicFields.find(
      (formFields: RegisterFields) => formFields.name === 'state'
    )

    if (stateFields) {
      if (stateList.length > 0) {
        stateFields.fieldType = 'dropdown'
        stateFields.options = stateList
      } else {
        stateFields.fieldType = 'text'
        stateFields.options = []
      }
    }

    setValue(
      'state',
      stateCode &&
        countryCode &&
        (stateList.find((state: State) => state.stateCode === stateCode) ||
          stateList.length === 0)
        ? stateCode
        : ''
    )

    dispatch({
      type: 'stateList',
      payload: {
        stateList,
        bcTob2bAddressBasicFields: [...bcTob2bAddressBasicFields],
      },
    })
  }

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const { country, state } = value
      if (name === 'country' && type === 'change') {
        handleCountryChange(country, state)
      }
    })
    return () => subscription.unsubscribe()
  }, [countryList])

  const getFileUrl = async (
    attachmentsList: RegisterFields[],
    data: CustomFieldItems
  ) => {
    let attachments: File[] = []

    if (!attachmentsList.length) return undefined

    attachmentsList.forEach((field: any) => {
      attachments = data[field.name] || []
    })

    try {
      const fileResponse = await Promise.all(
        attachments.map((file: File) =>
          uploadB2BFile({
            file,
            type: 'companyAttachedFile',
          })
        )
      )

      const fileList = fileResponse.reduce((fileList: any, res: any) => {
        if (res.code === 200) {
          fileList = [...fileList, res.data]
        } else {
          throw (
            res.data.errMsg ||
            res.message ||
            b3Lang('intl.global.fileUpload.fileUploadFailure')
          )
        }
        return fileList
      }, [])

      return fileList
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  const getB2BFieldsValue = async (
    data: CustomFieldItems,
    customerId: number | string,
    fileList: any
  ) => {
    const b2bFields: CustomFieldItems = {}

    b2bFields.customerId = customerId || ''
    b2bFields.storeHash = storeHash
    const companyInfo = bcTob2bCompanyInformation.filter(
      (list) => !list.custom && list.fieldType !== 'files'
    )
    const companyExtraInfo = bcTob2bCompanyInformation.filter(
      (list) => !!list.custom
    )
    // company field
    if (companyInfo.length) {
      companyInfo.forEach((item: any) => {
        b2bFields[toHump(deCodeField(item.name))] = data[item.name] || ''
      })
    }

    // Company Additional Field
    if (companyExtraInfo.length) {
      const extraFields: Array<CustomFieldItems> = []
      companyExtraInfo.forEach((item: CustomFieldItems) => {
        const itemExtraField: CustomFieldItems = {}
        itemExtraField.fieldName = deCodeField(item.name)
        itemExtraField.fieldValue = data[item.name] || ''
        extraFields.push(itemExtraField)
      })
      b2bFields.extraFields = extraFields
    }

    // b2bFields.companyEmail = data.email

    // address Field
    const addressBasicInfo = bcTob2bAddressBasicFields.filter(
      (list) => !list.custom
    )
    const addressExtraBasicInfo = bcTob2bAddressBasicFields.filter(
      (list) => !!list.custom
    )

    if (addressBasicInfo.length) {
      addressBasicInfo.forEach((field: CustomFieldItems) => {
        const name = deCodeField(field.name)
        if (name === 'address1') {
          b2bFields.addressLine1 = data[field.name] || ''
        }
        if (name === 'address2') {
          b2bFields.addressLine2 = data[field.name] || ''
        }
        b2bFields[name] = data[field.name] || ''
      })
    }

    // address Additional Field
    if (addressExtraBasicInfo.length) {
      const extraFields: Array<CustomFieldItems> = []
      addressExtraBasicInfo.forEach((item: CustomFieldItems) => {
        const itemExtraField: CustomFieldItems = {}
        itemExtraField.fieldName = deCodeField(item.name)
        itemExtraField.fieldValue = data[item.name] || ''
        extraFields.push(itemExtraField)
      })
      b2bFields.addressExtraFields = extraFields
    }
    b2bFields.fileList = fileList
    b2bFields.channelId = channelId

    return createB2BCompanyUser(b2bFields)
  }

  const validateCompanyExtraFieldsUnique = async (data: CustomFieldItems) => {
    try {
      const extraCompanyInformation = bcTob2bCompanyInformation.filter(
        (item: RegisterFields) => !!item.custom
      )
      const extraFields = extraCompanyInformation.map(
        (field: RegisterFields) => ({
          fieldName: deCodeField(field.name),
          fieldValue: data[field.name] || field.default,
        })
      )

      const res = await validateBCCompanyExtraFields({
        extraFields,
      })

      if (res.code !== 200) {
        const message = res.data?.errMsg || res.message || ''

        const messageArr = message.split(':')

        if (messageArr.length >= 2) {
          const field = extraCompanyInformation.find(
            (field) => deCodeField(field.name) === messageArr[0]
          )
          if (field) {
            setError(field.name, {
              type: 'manual',
              message: messageArr[1],
            })
            showLoading(false)
            return false
          }
        }
        throw message
      }

      setErrorMessage('')
      return true
    } catch (error) {
      console.log(error)
      throw error
    }
  }

  const handleNext = (event: MouseEvent) => {
    handleSubmit(async (data: CustomFieldItems) => {
      showLoading(true)

      try {
        const isValidate = await validateCompanyExtraFieldsUnique(data)
        if (!isValidate) {
          return
        }

        const attachmentsList = bcTob2bCompanyInformation.filter(
          (list) => list.fieldType === 'files'
        )
        const fileList = await getFileUrl(attachmentsList || [], data)

        await getB2BFieldsValue(data, customerId, fileList)

        const isAuto = companyAutoApproval.enabled

        if (emailAddress) {
          dispatch({
            type: 'finishInfo',
            payload: {
              submitSuccess: true,
              isAutoApproval: isAuto,
              blockPendingAccountOrderCreation,
            },
          })
          dispatch({
            type: 'all',
            payload: {
              accountType: '1',
            },
          })
          await getCurrentCustomerInfo(globalDispatch)
          setShowFinishPage(true)
        }
      } catch (err: any) {
        console.log(err)
        setErrorMessage(err?.message || err)
      } finally {
        showLoading(false)
      }
    })(event)
  }

  const handleFinish = () => {
    if (companyAutoApproval.enabled) {
      navigate('/orders')
    } else {
      window.location.href = '/'
    }
  }

  return (
    <B3Card setOpenPage={setOpenPage}>
      <RegisteredContainer isMobile={isMobile}>
        <B3Sping
          isSpinning={isLoading}
          tip={b3Lang('intl.global.tips.loading')}
          transparency="0"
        >
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
                  sx={{
                    maxWidth: '250px',
                  }}
                  onClick={() => {
                    window.location.href = '/'
                  }}
                >
                  <img
                    src={`${logo}`}
                    alt={b3Lang('intl.user.register.tips.registerLogo')}
                    loading="lazy"
                  />
                </ImageListItem>
              </RegisteredImage>
            )}

            {showFinishPage ? (
              <RegisteredFinish
                activeStep={steps.length}
                handleFinish={handleFinish}
                isBCToB2B
              />
            ) : (
              <Box
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
                <InformationLabels>
                  {b3Lang(
                    'intl.user.register.title.bcToB2B.businessAccountApplication'
                  )}
                </InformationLabels>

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
                      ? manipulateString(
                          bcTob2bContactInformation[0]?.groupName
                        )
                      : ''}
                  </InformationFourLabels>
                  <B3CustomForm
                    formFields={convertLabel(bcTob2bContactInformation || [])}
                    errors={errors}
                    control={control}
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
                    {bcTob2bCompanyInformation?.length
                      ? manipulateString(
                          bcTob2bCompanyInformation[0]?.groupName
                        )
                      : ''}
                  </InformationFourLabels>
                  <B3CustomForm
                    formFields={[
                      ...convertLabel(bcTob2bCompanyInformation),
                      ...convertLabel(bcTob2bCompanyExtraFields),
                    ]}
                    errors={errors}
                    control={control}
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
                    {bcTob2bAddressBasicFields?.length
                      ? bcTob2bAddressBasicFields[0]?.groupName
                      : ''}
                  </InformationFourLabels>

                  <B3CustomForm
                    formFields={bcTob2bAddressBasicFields}
                    errors={errors}
                    control={control}
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
                    <CustomButton variant="contained" onClick={handleNext}>
                      {b3Lang('intl.global.button.submit')}
                    </CustomButton>
                  </Box>
                )}
              </Box>
            )}
          </Box>
        </B3Sping>
      </RegisteredContainer>
    </B3Card>
  )
}
