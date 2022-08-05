import {
  useContext,
  MouseEvent,
  useEffect,
  useState,
} from 'react'

import {
  Box,
  Alert,
} from '@mui/material'

import {
  useForm,
} from 'react-hook-form'

import {
  B3CustomForm,
} from '@/components'
import RegisteredStepButton from './component/RegisteredStepButton'
import {
  RegisteredContext,
} from './context/RegisteredContext'

import {
  CustomFieldItems,
  RegisterFields,
  Country,
  State,
  Base64,
} from './config'

import {
  InformationFourLabels, TipContent,
} from './styled'

import {
  validateBCCompanyExtraFields,
} from '@/shared/service/b2b'

interface RegisteredDetailProps {
  handleBack: () => void,
  handleNext: () => void,
  activeStep: number,
}

export default function RegisteredDetail(props: RegisteredDetailProps) {
  const {
    handleBack,
    handleNext,
    activeStep,
  } = props

  const {
    state,
    dispatch,
  } = useContext(RegisteredContext)

  const [errorMessage, setErrorMessage] = useState('')

  const {
    accountType = '1',
    companyInformation = [],
    companyAttachment = [],
    addressBasicFields = [],
    bcAddressBasicFields = [],
    countryList = [],
  } = state

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
    mode: 'all',
  })
  const businessDetailsName = accountType === '1' ? companyInformation[0]?.groupName : ''

  const addressBasicName = accountType === '1' ? 'addressBasicFields' : 'bcAddressBasicFields'
  const addressBasicList = accountType === '1' ? addressBasicFields : bcAddressBasicFields

  const addressName = addressBasicList[0]?.groupName || ''

  const handleCountryChange = (countryCode: string, stateCode: string = '') => {
    const stateList = countryList.find((country: Country) => country.countryCode === countryCode)?.states || []
    const stateFields = addressBasicList.find((formFields: RegisterFields) => formFields.name === 'state')

    if (stateFields) {
      if (stateList.length > 0) {
        stateFields.fieldType = 'dropdown'
        stateFields.options = stateList
      } else {
        stateFields.fieldType = 'text'
        stateFields.options = []
      }
    }

    setValue('state', stateCode && countryCode && (stateList.find((state: State) => state.stateName === stateCode) || stateList.length === 0) ? stateCode : '')

    dispatch({
      type: 'stateList',
      payload: {
        stateList,
        [addressBasicName]: [...addressBasicList],
      },
    })
  }

  useEffect(() => {
    const countryValue = getValues('country')
    const stateValue = getValues('state')
    handleCountryChange(countryValue, stateValue)
  }, [])

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

  const showLading = (isShow = false) => {
    dispatch({
      type: 'loading',
      payload: {
        isLoading: isShow,
      },
    })
  }

  const getErrorMessage = (res: any, errorKey: string) => {
    const {
      data,
      message,
    } = res
    if (data[errorKey] && typeof data[errorKey] === 'object') {
      const errors = data[errorKey]

      let message = ''
      Object.keys(errors).forEach((error) => {
        message += `${error}:${errors[error]}`
      })

      return message
    }

    return data.errMsg || message
  }

  const setRegisterFieldsValue = (formFields: Array<RegisterFields>, formData: CustomFieldItems) => formFields.map((field) => {
    field.default = formData[field.name] || field.default
    return field
  })

  const handleAccountToFinish = (event: MouseEvent) => {
    handleSubmit(async (data: CustomFieldItems) => {
      showLading(true)

      try {
        if (accountType === '1') {
          const extraCompanyInformation = companyInformation.filter((item: RegisterFields) => !!item.custom)
          const extraFields = extraCompanyInformation.map((field: RegisterFields) => ({
            fieldName: Base64.decode(field.name),
            fieldValue: data[field.name] || field.default,
          }))

          const res = await validateBCCompanyExtraFields({
            extraFields,
          })

          if (res.code !== 200) {
            setErrorMessage(getErrorMessage(res, 'extraFields'))
            showLading(false)
            return
          }

          setErrorMessage('')
        }

        const newCompanyInformation = setRegisterFieldsValue(companyInformation, data)
        const newCompanyAttachment = setRegisterFieldsValue(companyAttachment, data)
        const newAddressBasicFields = setRegisterFieldsValue(addressBasicList, data)

        dispatch({
          type: 'all',
          payload: {
            companyInformation: [...newCompanyInformation],
            companyAttachment: [...newCompanyAttachment],
            [addressBasicName]: [...newAddressBasicFields],
          },
        })
        showLading(false)
        handleNext()
      } catch (error) {
        showLading(false)
      }
    })(event)
  }

  return (
    <Box
      sx={{
        pl: 10,
        pr: 10,
        mt: 2,
      }}
    >
      {
        errorMessage && (
        <Alert
          severity="error"
        >
          <TipContent>
            { errorMessage }
          </TipContent>
        </Alert>
        )
      }
      {
        accountType === '1' ? (
          <>
            <Box>
              <InformationFourLabels>{businessDetailsName}</InformationFourLabels>
              <B3CustomForm
                formFields={[...companyInformation]}
                errors={errors}
                control={control}
                getValues={getValues}
                setValue={setValue}
              />
            </Box>
          </>
        ) : <></>
      }

      <Box>
        <InformationFourLabels>{ addressName }</InformationFourLabels>

        <B3CustomForm
          formFields={addressBasicList}
          errors={errors}
          control={control}
          getValues={getValues}
          setValue={setValue}
        />
      </Box>

      <RegisteredStepButton
        handleBack={handleBack}
        handleNext={handleAccountToFinish}
        activeStep={activeStep}
      />
    </Box>
  )
}
