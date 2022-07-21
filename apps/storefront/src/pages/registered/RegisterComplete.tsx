import {
  useContext, useEffect, MouseEvent, useState,
} from 'react'
import {
  Box,
  Alert,
} from '@mui/material'
import { useForm } from 'react-hook-form'
import { useB3Lang } from '@b3/lang'

import { RegisteredContext } from './context/RegisteredContext'
import RegisteredStepButton from './component/RegisteredStepButton'
import { B3CustomForm } from '../../components'

import { createBCCompanyUser, createB2BCompanyUser, uploadB2BFile } from '../../shared/service/b2b'

import {
  RegisterFields, CustomFieldItems, Base64, validatorRules,
} from './config'

import { storeHash } from '../../utils'

import { InformationFourLabels, TipContent } from './styled'

interface RegisterCompleteProps {
  handleBack: () => void,
  handleNext: () => void,
  activeStep: number,
}

type RegisterCompleteList = Array<any> | undefined

export default function RegisterComplete(props: RegisterCompleteProps) {
  const b3Lang = useB3Lang()
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
    emailMarketingNewsletter, companyAttachment, companyExtraFields,
  } = state

  const emailName = accountType === '1' ? 'workEmailAddress' : 'emailAddress'
  const list:RegisterCompleteList = accountType === '1' ? contactInformation : bcContactInformationFields
  useEffect(() => {
    if (!accountType) return
    const newPasswordInformation: Array<CustomFieldItems> = []
    let emailItem: CustomFieldItems = {}
    if (list && list.length) {
      const emailFileds = list.find((item: RegisterFields) => item.name === emailName) || {}
      emailItem = { ...emailFileds }
      emailItem.label = `${b3Lang('intl.user.register.RegisterComplete.email')}`
      emailItem.name = 'email'
      emailItem.disabled = true
      newPasswordInformation.push(emailItem)
    }

    if (passwordInformation?.length) newPasswordInformation.push(passwordInformation[0])
    newPasswordInformation.push({
      default: '',
      required: true,
      label: b3Lang('intl.user.register.RegisterComplete.confirmPassword'),
      name: 'ConfirmPassword',
      id: 'Confirm Password',
      fieldType: 'password',
      xs: 12,
      validate: validatorRules(['password']),
    })

    setPersonalInfo(newPasswordInformation)
  }, [contactInformation, bcContactInformationFields, accountType])

  const getBCFieldsValue = (data: CustomFieldItems) => {
    const bcFields: CustomFieldItems = {}

    bcFields.authentication = {
      force_password_reset: false,
      new_password: data.password,
    }

    bcFields.accepts_product_review_abandoned_cart_emails = emailMarketingNewsletter

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
      storeHash,
      method: 'post',
      url: '/v3/customers',
      data: [bcFields],
    }

    return createBCCompanyUser(userItem)
  }

  const getB2BFieldsValue = async (data: CustomFieldItems, customerId: Number | String) => {
    const b2bFields: any = {}

    b2bFields.customerId = customerId || ''
    b2bFields.storeHash = storeHash
    if (companyInformation) {
      companyInformation.forEach((item: any) => {
        b2bFields[item.name] = item?.default || ''
      })
    }

    if (companyExtraFields) {
      const extraFields:Array<CustomFieldItems> = []
      companyExtraFields.forEach((item: any) => {
        const itemExtraField: CustomFieldItems = {}
        itemExtraField.fieldName = Base64.decode(item.name)
        itemExtraField.fieldValue = item?.default || ''
        extraFields.push(itemExtraField)
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

    let attachments: File[] = []
    if (companyAttachment) {
      companyAttachment.forEach((field: any) => {
        if (field.name === 'companyAttachments') {
          attachments = field.default
        }
      })
    }

    try {
      const fileResponse = await Promise.all(attachments.map(
        (file: File) => uploadB2BFile({
          file,
          type: 'companyAttachedFile',
        }),
      ))

      b2bFields.fileList = fileResponse.reduce((fileList: any, res: any) => {
        if (res.code === 200) {
          fileList = [...fileList, res.data]
        }
        return fileList
      }, [])
    } catch (error) {
      b2bFields.fileList = []
    }

    return createB2BCompanyUser(b2bFields)
  }

  const handleCompleted = (event: MouseEvent) => {
    handleSubmit(async (completeData: CustomFieldItems) => {
      if (completeData.password !== completeData.ConfirmPassword) {
        setErrorMessage(b3Lang('intl.user.register.RegisterComplete.passwordMatchPrompt'))
        return
      }
      try {
        if (dispatch) {
          dispatch({
            type: 'loading',
            payload: {
              isLoading: true,
            },
          })
        }

        let isAuto = true
        if (accountType === '2') {
          await getBCFieldsValue(completeData)
        } else {
          const res = await getBCFieldsValue(completeData)
          const { data } = res
          const accountInfo = await getB2BFieldsValue(completeData, (data as any)[0].id)

          const { companyCreate: { company: { companyStatus } } } = accountInfo
          isAuto = +companyStatus === 1
        }
        if (dispatch) {
          dispatch({
            type: 'loading',
            payload: {
              isLoading: false,
            },
          })
          dispatch({
            type: 'finishInfo',
            payload: {
              submitSuccess: true,
              isAutoApproval: isAuto,
            },
          })
        }
        handleNext()
      } catch (error) {
        dispatch({
          type: 'loading',
          payload: {
            isLoading: false,
          },
        })
        console.log(error, 'error')
      } finally {
        dispatch({
          type: 'loading',
          payload: {
            isLoading: false,
          },
        })
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
        <InformationFourLabels>{b3Lang('intl.user.register.RegisterComplete.title')}</InformationFourLabels>
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
