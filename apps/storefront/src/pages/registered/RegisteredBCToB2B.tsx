import {
  useEffect,
  useState,
  useContext,
  MouseEvent,
} from 'react'

import {
  Box,
  Button,
  ImageListItem,
} from '@mui/material'

import {
  useB3Lang,
} from '@b3/lang'

import {
  useForm,
} from 'react-hook-form'
import {
  InformationFourLabels,
  InformationLabels,
  RegisteredContainer, RegisteredImage,
} from './styled'

import {
  getB2BRegisterLogo,
  getB2BCountries,
  storeB2BBasicInfo,
  getB2BAccountFormFields,
} from '../../shared/service/b2b'

import {
  B3CustomForm,
} from '../../components'

import {
  RegisteredContext,
} from './context/RegisteredContext'

import {
  B3Sping,
} from '../../components/spin/B3Sping'

import {
  RegisterFields,
  getRegisterLogo,
  Country,
  State,
  CustomFieldItems,
  getAccountFormFields,
  RegisterFieldsItems,
} from './config'

export default function RegisteredBCToB2B() {
  const [logo, setLogo] = useState('')

  const b3Lang = useB3Lang()

  const {
    control,
    handleSubmit,
    getValues,
    formState: {
      errors,
    },
    setValue,
    watch,
  } = useForm({
    mode: 'onSubmit',
  })

  const {
    state,
    dispatch,
  } = useContext(RegisteredContext)

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

        const accountFormAllFields = await getB2BAccountFormFields(3)

        const bcToB2BAccountFormFields = getAccountFormFields(accountFormAllFields?.accountFormFields || [])
        const {
          quoteConfig,
        } = await getB2BRegisterLogo()
        const {
          countries,
        } = await getB2BCountries()
        const {
          storeBasicInfo: {
            storeName,
          },
        } = await storeB2BBasicInfo()
        const registerLogo = getRegisterLogo(quoteConfig)

        const newAddressInformationFields = bcToB2BAccountFormFields.address.map((addressFields: Partial<RegisterFieldsItems>):Partial<RegisterFieldsItems> => {
          if (addressFields.name === 'country') {
            addressFields.options = countries
          }
          return addressFields
        })

        const newContactInformation = bcToB2BAccountFormFields.contactInformation.map((contactInformationField: Partial<RegisterFieldsItems>):Partial<RegisterFieldsItems> => {
          contactInformationField.disabled = true

          return contactInformationField
        })

        if (dispatch) {
          dispatch({
            type: 'all',
            payload: {
              isLoading: false,
              storeName,
              contactInformation: [...newContactInformation],
              companyExtraFields: [],
              companyInformation: [...bcToB2BAccountFormFields.businessDetails],
              addressBasicFields: [...newAddressInformationFields],
              countryList: [...countries],
            },
          })
        }
        setLogo(registerLogo)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.error(e)
      }
    }

    getBCAdditionalFields()
  }, [])

  const {
    contactInformation,
    isLoading,
    companyInformation = [],
    // companyAttachment = [],
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

  useEffect(() => {
    const subscription = watch((value, {
      name,
      type,
    }) => {
      const {
        country,
        state,
      } = value
      if (name === 'country' && type === 'change') {
        handleCountryChange(country, state)
      }
    })
    return () => subscription.unsubscribe()
  }, [countryList])

  const handleNext = (event: MouseEvent) => {
    handleSubmit(async (data: CustomFieldItems) => {
      // eslint-disable-next-line no-console
      console.log(data)
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
              maxWidth: '250px',
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

        <InformationLabels>{b3Lang('intl.user.register.title.bcToB2B.businessAccountApplication')}</InformationLabels>

        <Box>
          <InformationFourLabels>{contactInformation?.length ? contactInformation[0]?.groupName : ''}</InformationFourLabels>
          <B3CustomForm
            formFields={contactInformation}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />

        </Box>

        <Box>
          <InformationFourLabels>{companyInformation?.length ? companyInformation[0]?.groupName : ''}</InformationFourLabels>
          <B3CustomForm
            formFields={[...companyInformation, ...companyExtraFields]}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
        </Box>

        <Box>
          <InformationFourLabels>{addressBasicFields?.length ? addressBasicFields[0]?.groupName : ''}</InformationFourLabels>

          <B3CustomForm
            formFields={addressBasicFields}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
        </Box>
      </B3Sping>
      <Box sx={{
        display: 'flex',
        flexDirection: 'row-reverse',
        pt: 2,
      }}
      >
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
