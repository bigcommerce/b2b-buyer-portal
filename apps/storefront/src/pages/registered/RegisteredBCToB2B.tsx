import {
  useEffect, useState, useContext, MouseEvent,
} from 'react'

import {
  Box,
  Button,
  ImageListItem,
} from '@mui/material'

import { useB3Lang } from '@b3/lang'

import { useForm } from 'react-hook-form'
import {
  InformationFourLabels, InformationLabels,
  RegisteredContainer, RegisteredImage,
} from './styled'

import {
  getB2BRegisterCustomFields, getB2BRegisterLogo, getB2BCountries, storeB2BBasicInfo,
} from '../../shared/service/b2b'

import { B3CustomForm } from '../../components'

import { RegisteredContext } from './context/RegisteredContext'

import { B3Sping } from '../../components/spin/B3Sping'

import {
  conversionDataFormat,
  RegisterFields,
  contactInformationFields,
  getRegisterLogo,
  companyInformationFields,
  companyAttachmentsFields,
  addressInformationFields,
  addressFieldsRequired,
  Country,
  State,
  CustomFieldItems,
} from './config'

export default function RegisteredBCToB2B() {
  const [logo, setLogo] = useState('')

  const b3Lang = useB3Lang()

  const {
    control, handleSubmit, getValues, formState: { errors }, setValue, watch,
  } = useForm({
    mode: 'onSubmit',
  })

  const { state, dispatch } = useContext(RegisteredContext)

  useEffect(() => {
    const getBCAdditionalFields = async () => {
      try {
        if (dispatch) {
          dispatch({
            type: 'loading',
            payload: {
              isLoading: true,
            },
          })
          dispatch({
            type: 'finishInfo',
            payload: {
              submitSuccess: false,
            },
          })
        }

        const { companyExtraFields } = await getB2BRegisterCustomFields()
        const { quoteConfig } = await getB2BRegisterLogo()
        const { countries } = await getB2BCountries()
        const { storeBasicInfo: { storeName } } = await storeB2BBasicInfo()
        const registerLogo = getRegisterLogo(quoteConfig)

        const filterCompanyExtraFields = companyExtraFields.length ? companyExtraFields.filter((field: RegisterFields) => field?.visibleToEnduser) : []
        const newCompanyExtraFields: Array<RegisterFields> = conversionDataFormat(filterCompanyExtraFields)

        const newAddressInformationFields = addressInformationFields(b3Lang).map((addressFields) => {
          if (addressFields.name === 'country') {
            addressFields.options = countries
          }
          return addressFields
        })

        if (dispatch) {
          dispatch({
            type: 'all',
            payload: {
              isLoading: false,
              storeName,
              contactInformation: [...contactInformationFields(b3Lang)],
              companyExtraFields: [...newCompanyExtraFields],
              companyInformation: [...companyInformationFields(b3Lang)],
              companyAttachment: [...companyAttachmentsFields(b3Lang)],
              addressBasicFields: [...newAddressInformationFields],
              countryList: [...countries],
            },
          })
        }
        setLogo(registerLogo)
      } catch (e) {
        console.log(e)
      }
    }

    getBCAdditionalFields()
  }, [])

  const setAddressFieldsRequire = (accountType: string, addressBasicFields: Array<RegisterFields>) => {
    const fieldRequired = addressFieldsRequired[`account_type_${accountType || '1'}`] || {}

    addressBasicFields.forEach((field: RegisterFields) => {
      field.required = fieldRequired[field.name] || false
    })

    return addressBasicFields
  }

  const {
    contactInformation,
    isLoading,
    companyInformation = [],
    companyAttachment = [],
    addressBasicFields = [],
    countryList = [],
    companyExtraFields = [],
  } = state

  const handleCountryChange = (countryCode: string, stateCode: string = '') => {
    const stateList = countryList.find((country: Country) => country.countryCode === countryCode)?.states || []
    const stateFields = addressBasicFields.find((formFields: RegisterFields) => formFields.name === 'state')

    if (stateFields) {
      if (stateList.length > 0) {
        stateFields.fieldType = 'dropdown'
        stateFields.options = stateList
      } else {
        stateFields.fieldType = 'text'
        stateFields.options = []
      }
    }

    setValue('state', stateCode && countryCode && (stateList.find((state: State) => state.stateCode === stateCode) || stateList.length === 0) ? stateCode : '')

    dispatch({
      type: 'stateList',
      payload: {
        stateList,
        addressBasicFields: [...addressBasicFields],
      },
    })
  }

  const [addressFields, setAddressFields] = useState<Array<RegisterFields>>(addressBasicFields)

  useEffect(() => {
    if (addressBasicFields && addressBasicFields.length) {
      setAddressFields([...setAddressFieldsRequire('1', addressBasicFields)])
    }
  }, [addressBasicFields])

  useEffect(() => {
    const subscription = watch((value, { name, type }) => {
      const { country, state } = value
      if (name === 'country' && type === 'change') {
        handleCountryChange(country, state)
      }
    })
    return () => subscription.unsubscribe()
  }, [countryList])

  const handleNext = (event: MouseEvent) => {
    handleSubmit(async (data: CustomFieldItems) => {
      console.log(data, 'data')
    })(event)
  }

  return (
    <RegisteredContainer>
      <B3Sping
        isSpinning={isLoading}
        tip={b3Lang('intl.global.tips.loading')}
      >
        {
          logo && (
          <RegisteredImage>
            <ImageListItem sx={{
              maxWidth: '130px',
              maxHeight: '130px',
            }}
            >
              <img
                src={`${logo}`}
                alt={b3Lang('intl.user.register.tips.registerLogo')}
                loading="lazy"
              />
            </ImageListItem>
          </RegisteredImage>
          )
        }

        <InformationLabels>Business Account Application</InformationLabels>

        <Box>
          <InformationFourLabels>{b3Lang('intl.user.register.registeredAccount.contactInformation')}</InformationFourLabels>
          <B3CustomForm
            formFields={contactInformation}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />

        </Box>

        <Box>
          <InformationFourLabels>{b3Lang('intl.user.register.title.businessDetails')}</InformationFourLabels>
          <B3CustomForm
            formFields={[...companyInformation, ...companyExtraFields]}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
        </Box>
        <Box>
          <InformationFourLabels>{b3Lang('intl.user.register.title.attachments')}</InformationFourLabels>
          <B3CustomForm
            formFields={companyAttachment}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
        </Box>

        <Box>
          <InformationFourLabels>{b3Lang('intl.user.register.title.address')}</InformationFourLabels>

          <B3CustomForm
            formFields={addressFields}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
        </Box>
      </B3Sping>
      <Box sx={{ display: 'flex', flexDirection: 'row-reverse', pt: 2 }}>
        <Button
          variant="contained"
          onClick={handleNext}
        >
          {b3Lang('intl.global.button.submit')}
        </Button>
      </Box>

    </RegisteredContainer>
  )
}
