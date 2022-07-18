import {
  useContext,
  MouseEvent,
  useEffect,
  useState,
} from 'react'

import {
  Box,
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
} from './config'

const InformationFourLabels = styled('h4')(() => ({
  marginBottom: '20px',
}))

const AddressBox = styled(Box)(() => ({
  '& .MuiGrid-item': {
    alignItems: 'flex-end',
    display: 'flex',
  },
}))

export default function RegisteredDetail(props: any) {
  const { handleBack, handleNext, activeStep } = props

  const { state, dispatch } = useContext(RegisteredContext)

  const {
    accountType,
    companyInformation = [],
    companyAttachment = [],
    addressBasicFields = [],
    addressExtraFields = [],
    countryList = [],
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

    setValue('state', stateCode && stateList.find((state: State) => state.stateCode === stateCode) ? stateCode : '')

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

  const setRegisterFiledsValue = (formFields: Array<any>, formData: CustomFieldItems) => formFields.map((fields) => {
    fields.default = formData[fields.name] || fields.default
    return fields
  })

  const handleAccountToFinish = (event: MouseEvent) => {
    handleSubmit((data: CustomFieldItems) => {
      const newCompanyInformation = setRegisterFiledsValue(companyInformation, data)
      const newCompanyAttachment = setRegisterFiledsValue(companyAttachment, data)
      const newAddressBasicFields = setRegisterFiledsValue(addressBasicFields, data)
      const newAddressExtraFields = setRegisterFiledsValue(addressExtraFields, data)

      dispatch({
        type: 'all',
        payload: {
          companyInformation: [...newCompanyInformation],
          companyAttachment: [...newCompanyAttachment],
          addressBasicFields: [...newAddressBasicFields],
          addressExtraFields: [...newAddressExtraFields],
        },
      })
      handleNext()
    })(event)
  }

  return (
    <div>
      {
        accountType === '1' ? (
          <>
            <Box>
              <InformationFourLabels>Business Details</InformationFourLabels>
              <B3CustomForm
                formFields={companyInformation}
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
