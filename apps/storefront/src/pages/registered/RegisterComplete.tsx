import {
  useContext, useEffect, MouseEvent, useState,
} from 'react'
import {
  Box,
  Alert,
} from '@mui/material'
import styled from '@emotion/styled'
import { useForm } from 'react-hook-form'

import { RegisteredContext } from './context/RegisteredContext'
import RegisteredStepButton from './component/RegisteredStepButton'
import { B3CustomForm } from '../../components'

import { createBCCompanyUser } from '../../shared/service/b2b'

import { RegisterFileds, CustomFieldItems } from './config'

const InformationFourLabels = styled('h4')(() => ({
  marginBottom: '20px',
}))

interface RegisterCompleteProps {
  handleBack: () => void,
  handleNext: () => void,
  activeStep: number,
}

type RegisterCompleteList = Array<any> | undefined

const TipContent = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
}))

export default function RegisterComplete(props: RegisterCompleteProps) {
  const { handleBack, activeStep, handleNext } = props

  const [personalInfo, setPersonalInfo] = useState<Array<CustomFieldItems>>([])
  const [errorMessage, setErrorMessage] = useState<String>('')

  const {
    control, handleSubmit, formState: { errors },
  } = useForm({
    mode: 'all',
  })
  const { state } = useContext(RegisteredContext)

  const {
    contactInformation, bcContactInformationFields, passwordInformation, accountType,
    additionalInformation, addressBasicFields, addressExtraFields,
  } = state

  const emailName = accountType === '1' ? 'workEmailAddress' : 'emailAddress'
  const list:RegisterCompleteList = accountType === '1' ? contactInformation : bcContactInformationFields
  useEffect(() => {
    if (!accountType) return
    const newPasswordInformation: Array<CustomFieldItems> = []
    let emailItem: CustomFieldItems = {}
    if (list && list.length) {
      const emailFileds = list.find((item: RegisterFileds) => item.name === emailName) || {}
      emailItem = { ...emailFileds }
    }
    emailItem.label = 'email'
    emailItem.name = 'email'
    emailItem.disabled = true
    newPasswordInformation.push(emailItem)

    if (passwordInformation?.length) newPasswordInformation.push(passwordInformation[0])
    newPasswordInformation.push({
      default: '',
      required: true,
      label: 'Confirm Password',
      name: 'Confirm Password',
      id: 'Confirm Password',
      fieldType: 'password',
      xs: 12,
    })

    setPersonalInfo(newPasswordInformation)
  }, [contactInformation, bcContactInformationFields, accountType])

  const getBCFieldsValue = (data: CustomFieldItems) => {
    const bcFields: CustomFieldItems = {}

    bcFields.authentication = {
      force_password_reset: false,
      new_password: data.password,
    }
    if (list) {
      list.forEach((item: any) => {
        if (item.name === 'lastName') {
          bcFields.last_name = item.default
        }
        if (item.name === 'firstName') {
          bcFields.first_name = item.default
        }
        if (item.name === 'phoneNumber') {
          bcFields.phone = item?.default || ''
        }
        if (item.name === 'companyName') {
          bcFields.company = item?.default || ''
        }
        if (item.name === emailName) {
          bcFields.email = item.default
        }
      })

      bcFields.form_fields = []

      if (additionalInformation && (additionalInformation as Array<CustomFieldItems>).length) {
        additionalInformation.forEach((field: CustomFieldItems) => {
          bcFields.form_fields.push({
            name: field.name,
            value: field.default,
          })
        })
      }
    }

    if (addressBasicFields) {
      bcFields.addresses = {}
      addressBasicFields.forEach((field: any) => {
        if (field.name === 'country') {
          bcFields.addresses.country_code = field.default
        }
        if (field.name === 'address1') {
          bcFields.addresses.address1 = field.default
        }
        if (field.name === 'address2') {
          bcFields.addresses.address2 = field.default
        }
        if (field.name === 'city') {
          bcFields.addresses.city = field.default
        }
        if (field.name === 'state_or_province') {
          bcFields.addresses.state_or_province = field.default
        }
        if (field.name === 'postal_code') {
          bcFields.addresses.country_code = field.default
        }
      })
    }
    bcFields.addresses.first_name = bcFields.first_name
    bcFields.addresses.last_name = bcFields.last_name

    bcFields.addresses.form_fields = []
    if (addressExtraFields && addressExtraFields.length) {
      addressExtraFields.forEach((field: any) => {
        bcFields.addresses.form_fields.push({
          name: field.name,
          value: field.default,
        })
      })
    }

    const userItem: any = {
      storeHash: 'rtmh8fqr05',
      method: 'post',
      url: '/v3/customers',
      data: [bcFields],
    }

    createBCCompanyUser(userItem)
  }

  const getB2BFieldsValue = (data: CustomFieldItems) => {}

  const handleCompleted = (event: MouseEvent) => {
    handleSubmit((data: CustomFieldItems) => {
      if (accountType === '2') {
        getBCFieldsValue(data)
      } else {
        getB2BFieldsValue(data)
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
            {errorMessage}
          </TipContent>
        </Alert>
        )
      }
      <Box>
        <InformationFourLabels>Complete Registration</InformationFourLabels>
        {
          personalInfo && (
          <B3CustomForm
            formFields={personalInfo}
            errors={errors}
            control={control}
          />
          )
        }
      </Box>

      <RegisteredStepButton
        handleBack={handleBack}
        activeStep={activeStep}
        handleNext={handleCompleted}
      />
    </Box>
  )
}
