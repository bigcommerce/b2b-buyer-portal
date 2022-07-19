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

import { createBCCompanyUser, createB2BCompanyUser } from '../../shared/service/b2b'

import { RegisterFileds, CustomFieldItems, Base64 } from './config'

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
  const { state, dispatch } = useContext(RegisteredContext)

  const {
    contactInformation, bcContactInformationFields, passwordInformation, accountType,
    additionalInformation, addressBasicFields, addressExtraFields, companyInformation,
    emailMarketingNewsletter,
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

    emailItem.accepts_product_review_abandoned_cart_emails = emailMarketingNewsletter

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
            name: field.label,
            value: field.default,
          })
        })
      }
    }

    const addresses: any = {}

    if (addressBasicFields) {
      bcFields.addresses = {}
      addressBasicFields.forEach((field: any) => {
        if (field.name === 'country') {
          addresses.country_code = field.default
        }
        if (field.name === 'address1') {
          addresses.address1 = field.default
        }
        if (field.name === 'address2') {
          addresses.address2 = field.default
        }
        if (field.name === 'city') {
          addresses.city = field.default
        }
        if (field.name === 'state') {
          addresses.state_or_province = field.default
        }
        if (field.name === 'zipCode') {
          addresses.postal_code = field.default
        }
      })
    }
    addresses.first_name = bcFields.first_name
    addresses.last_name = bcFields.last_name

    addresses.form_fields = []
    // BC Extra field
    if (addressExtraFields && addressExtraFields.length) {
      addressExtraFields.forEach((field: any) => {
        addresses.form_fields.push({
          name: field.label,
          value: field.default,
        })
      })
    }

    bcFields.addresses = [addresses]

    const userItem: any = {
      storeHash: (window as any).b3?.setting?.storeHash || 'rtmh8fqr05',
      method: 'post',
      url: '/v3/customers',
      data: [bcFields],
    }

    return createBCCompanyUser(userItem)
  }

  const getB2BFieldsValue = async (data: CustomFieldItems, customerId: Number | String) => {
    const b2bFields: any = {}

    b2bFields.customerId = customerId || ''
    b2bFields.storeHash = (window as any).b3?.setting?.storeHash || 'rtmh8fqr05'
    if (companyInformation) {
      const extraFields:Array<CustomFieldItems> = []
      companyInformation.forEach((item: any) => {
        if (item.name === 'companyName' || item.name === 'companyEmail' || item.name === 'companyPhoneNumber') {
          b2bFields[item.name] = item?.default || ''
        } else {
          const itemExtraField: CustomFieldItems = {}
          itemExtraField.fieldName = Base64.decode(item.name)
          itemExtraField.fieldValue = item?.default || ''
          extraFields.push(itemExtraField)
        }
      })
      b2bFields.extraFields = extraFields
    }

    b2bFields.companyEmail = data.email

    if (addressBasicFields) {
      addressBasicFields.forEach((field: any) => {
        if (field.name === 'country') {
          b2bFields.country = field.default
        }
        if (field.name === 'address1') {
          b2bFields.addressLine1 = field.default
        }
        if (field.name === 'address2') {
          b2bFields.addressLine2 = field.default
        }
        if (field.name === 'city') {
          b2bFields.city = field.default
        }
        if (field.name === 'state') {
          b2bFields.state = field.default
        }
        if (field.name === 'zipCode') {
          b2bFields.zipCode = field.default
        }
      })
    }

    return createB2BCompanyUser(b2bFields)
  }

  const handleCompleted = (event: MouseEvent) => {
    handleSubmit(async (completeData: CustomFieldItems) => {
      try {
        if (dispatch) {
          dispatch({
            type: 'loading',
            payload: {
              isLoading: true,
            },
          })
        }
        if (accountType === '2') {
          await getBCFieldsValue(completeData)
        } else {
          const res = await getBCFieldsValue(completeData)
          const { data } = res
          await getB2BFieldsValue(completeData, (data as any)[0].id)
        }
        if (dispatch) {
          dispatch({
            type: 'loading',
            payload: {
              isLoading: false,
            },
          })
        }
      } catch (error) {
        console.log(error, 'error')
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
