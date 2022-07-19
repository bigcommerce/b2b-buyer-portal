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

import styled from '@emotion/styled'
import { useForm } from 'react-hook-form'

import { B3CustomForm } from '../../components'

import RegisteredStepButton from './component/RegisteredStepButton'
import { RegisteredContext } from './context/RegisteredContext'

import {
  CustomFieldItems,
  RegisterFileds,
  addressInformationFields,
  Country,
  State,
  Base64,
} from './config'

import { validateBCCompanyExtraFields } from '../../shared/service/b2b'

const InformationFourLabels = styled('h4')(() => ({
  marginBottom: '20px',
}))

const AddressBox = styled(Box)(() => ({
  '& .MuiGrid-item': {
    alignItems: 'flex-end',
    display: 'flex',
  },
}))

const TipContent = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
}))

export default function RegisteredDetail(props: any) {
  const { handleBack, handleNext, activeStep } = props

  const { state, dispatch } = useContext(RegisteredContext)

  const [errorMessage, setErrorMessage] = useState('')

  const {
    accountType,
    companyInformation = [],
    companyAttachment = [],
    addressBasicFields = [],
    addressExtraFields = [],
    countryList = [],
    companyExtraFields = [],
  } = state

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
    watch,
  } = useForm({
    mode: 'onSubmit',
  })

  const [addressFields, setAddressFields] = useState<Array<any>>(addressBasicFields)

  useEffect(() => {
    if (accountType === '1') {
      setAddressFields([...addressBasicFields])
    } else {
      setAddressFields([...addressBasicFields, ...addressExtraFields])
    }
  }, [accountType])

  const handleCountryChange = (countryCode: string, stateCode: string = '') => {
    const stateList = countryList.find((country: Country) => country.countryCode === countryCode)?.states || []
    const stateFields = addressInformationFields.find((formFileds: RegisterFileds) => formFileds.name === 'state')

    if (stateFields) {
      if (stateList.length > 0) {
        stateFields.fieldType = 'dropdown'
        stateFields.options = stateList
      } else {
        stateFields.fieldType = 'text'
        stateFields.options = []
      }
    }

    setValue('state', stateCode && (stateList.find((state: State) => state.stateCode === stateCode) || stateList.length === 0) ? stateCode : '')

    dispatch({
      type: 'stateList',
      payload: {
        stateList,
        addressBasicFields: [...addressInformationFields],
      },
    })
  }

  useEffect(() => {
    const countryValue = getValues('country')
    const stateValue = getValues('state')

    handleCountryChange(countryValue, stateValue)
  }, [])

  useEffect(() => {
    const subscription = watch(({ country }, { name, type }) => {
      if (name === 'country' && type === 'change') {
        handleCountryChange(country)
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

  const getErrorMessage = (data: any, errorKey: string) => {
    if (data[errorKey] && typeof data[errorKey] === 'object') {
      const errors = data[errorKey]

      let message = ''
      Object.keys(errors).forEach((error) => {
        message += `${error}:${errors[error]}`
      })

      return message
    }

    return data.errMsg || ''
  }

  const setRegisterFiledsValue = (formFields: Array<any>, formData: CustomFieldItems) => formFields.map((field) => {
    field.default = formData[field.name] || field.default
    return field
  })

  const handleAccountToFinish = (event: MouseEvent) => {
    handleSubmit(async (data: CustomFieldItems) => {
      showLading(true)

      try {
        const extraFields = companyExtraFields.map((field: any) => ({
          fieldName: Base64.decode(field.name),
          fieldValue: data[field.name] || field.default,
        }))

        const res = await validateBCCompanyExtraFields({
          extraFields,
        })

        if (res.code !== 200) {
          setErrorMessage(getErrorMessage(res.data, 'extraFields'))
          showLading(false)
          return
        }

        setErrorMessage('')

        const newCompanyInformation = setRegisterFiledsValue(companyInformation, data)
        const newCompanyExtraFields = setRegisterFiledsValue(companyExtraFields, data)
        const newCompanyAttachment = setRegisterFiledsValue(companyAttachment, data)
        const newAddressBasicFields = setRegisterFiledsValue(addressBasicFields, data)
        const newAddressExtraFields = setRegisterFiledsValue(addressExtraFields, data)

        dispatch({
          type: 'all',
          payload: {
            companyInformation: [...newCompanyInformation],
            companyExtraFields: [...newCompanyExtraFields],
            companyAttachment: [...newCompanyAttachment],
            addressBasicFields: [...newAddressBasicFields],
            addressExtraFields: [...newAddressExtraFields],
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
    <div>
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
              <InformationFourLabels>Business Details</InformationFourLabels>
              <B3CustomForm
                formFields={[...companyInformation, ...companyExtraFields]}
                errors={errors}
                control={control}
                getValues={getValues}
                setValue={setValue}
              />
            </Box>
            <Box>
              <InformationFourLabels>Attachments</InformationFourLabels>
              <B3CustomForm
                formFields={companyAttachment}
                errors={errors}
                control={control}
                getValues={getValues}
                setValue={setValue}
              />
            </Box>
          </>
        ) : <></>
      }

      <AddressBox>
        <InformationFourLabels>Address</InformationFourLabels>

        <B3CustomForm
          formFields={addressFields}
          errors={errors}
          control={control}
          getValues={getValues}
          setValue={setValue}
        />
      </AddressBox>

      <RegisteredStepButton
        handleBack={handleBack}
        handleNext={handleAccountToFinish}
        activeStep={activeStep}
      />
    </div>
  )
}
