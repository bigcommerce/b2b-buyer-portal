import {
  useContext,
  useEffect,
  MouseEvent,
  useState,
  // useMemo,
} from 'react'
import {
  Box,
  Alert,
} from '@mui/material'
import {
  useForm,
} from 'react-hook-form'
import {
  useB3Lang,
} from '@b3/lang'

// import {
//   Captcha,
// } from '@/components/form'

import {
  RegisteredContext,
} from './context/RegisteredContext'
import RegisteredStepButton from './component/RegisteredStepButton'
import {
  B3CustomForm,
} from '@/components'

import {
  createBCCompanyUser,
  createB2BCompanyUser,
  uploadB2BFile,
} from '@/shared/service/b2b'

import {
  RegisterFields, deCodeField, toHump,
} from './config'

import {
  InformationFourLabels, TipContent,
} from './styled'

import {
  storeHash,
  // captchaSetkey,
} from '@/utils'

interface RegisterCompleteProps {
  handleBack: () => void,
  handleNext: () => void,
  activeStep: number,
}

type RegisterCompleteList = Array<RegisterFields> | undefined

export default function RegisterComplete(props: RegisterCompleteProps) {
  const b3Lang = useB3Lang()
  const {
    handleBack,
    activeStep,
    handleNext,
  } = props

  const [personalInfo, setPersonalInfo] = useState<Array<CustomFieldItems>>([])
  const [errorMessage, setErrorMessage] = useState<String>('')
  // const [captchaMessage, setCaptchaMessage] = useState<string>('')

  const {
    control,
    handleSubmit,
    setError,
    formState: {
      errors,
    },
  } = useForm({
    mode: 'all',
  })
  const {
    state,
    dispatch,
  } = useContext(RegisteredContext)

  const {
    contactInformation,
    bcContactInformation,
    passwordInformation = [],
    bcPasswordInformation = [],
    accountType,
    additionalInformation,
    bcAdditionalInformation,
    addressBasicFields = [],
    bcAddressBasicFields = [],
    companyInformation = [],
    emailMarketingNewsletter,
  } = state

  const list:RegisterCompleteList = accountType === '1' ? contactInformation : bcContactInformation
  const passwordInfo:RegisterCompleteList = accountType === '1' ? passwordInformation : bcPasswordInformation

  const passwordName = passwordInfo[0]?.groupName || ''

  const additionalInfo:RegisterCompleteList = accountType === '1' ? additionalInformation : bcAdditionalInformation

  const addressBasicList = accountType === '1' ? addressBasicFields : bcAddressBasicFields

  useEffect(() => {
    if (!accountType) return
    let newPasswordInformation: Array<CustomFieldItems> = []
    let emailItem: CustomFieldItems = {}
    if (list && list.length) {
      const emailFields = list.find((item: RegisterFields) => item.name === 'email') || {}
      emailItem = {
        ...emailFields,
      }
      emailItem.label = `${b3Lang('intl.user.register.RegisterComplete.email')}`
      emailItem.name = 'email'
      emailItem.disabled = true
      newPasswordInformation.push(emailItem)
    }

    newPasswordInformation = [...newPasswordInformation, ...passwordInfo]

    setPersonalInfo(newPasswordInformation)
  }, [contactInformation, bcContactInformation, accountType])

  const getBCFieldsValue = (data: CustomFieldItems) => {
    const bcFields: CustomFieldItems = {}

    bcFields.authentication = {
      force_password_reset: false,
      new_password: data.password,
    }

    bcFields.accepts_product_review_abandoned_cart_emails = emailMarketingNewsletter

    if (list) {
      list.forEach((item: any) => {
        const name = deCodeField(item.name)
        if (name === 'accepts_marketing_emails') {
          bcFields.accepts_product_review_abandoned_cart_emails = !!item?.default?.length
        } else {
          bcFields[name] = item?.default || ''
        }
      })

      bcFields.form_fields = []
      if (additionalInfo && (additionalInfo as Array<CustomFieldItems>).length) {
        additionalInfo.forEach((field: CustomFieldItems) => {
          bcFields.form_fields.push({
            name: field.bcLabel,
            value: field.default,
          })
        })
      }
    }

    bcFields.addresses = []

    if (accountType === '2') {
      const addresses: CustomFieldItems = {}

      const getBCAddressField = addressBasicList.filter((field: any) => !field.custom)
      const getBCExtraAddressField = addressBasicList.filter((field: any) => field.custom)

      if (getBCAddressField) {
        bcFields.addresses = {}
        getBCAddressField.forEach((field: any) => {
          if (field.name === 'country') {
            addresses.country_code = field.default
          } else if (field.name === 'state') {
            addresses.state_or_province = field.default
          } else if (field.name === 'postalCode') {
            addresses.postal_code = field.default
          } else if (field.name === 'firstName') {
            addresses.first_name = field.default
          } else if (field.name === 'lastName') {
            addresses.last_name = field.default
          } else {
            addresses[field.name] = field.default
          }
        })
      }

      addresses.form_fields = []
      // BC Extra field
      if (getBCExtraAddressField && getBCExtraAddressField.length) {
        getBCExtraAddressField.forEach((field: any) => {
          addresses.form_fields.push({
            name: field.bcLabel,
            value: field.default,
          })
        })
      }

      bcFields.addresses = [addresses]
    }

    const userItem: any = {
      storeHash,
      method: 'post',
      url: '/v3/customers',
      data: [bcFields],
    }

    return createBCCompanyUser(userItem)
  }

  const getB2BFieldsValue = async (data: CustomFieldItems, customerId: Number | String, fileList: any) => {
    const b2bFields: CustomFieldItems = {}

    b2bFields.customerId = customerId || ''
    b2bFields.storeHash = storeHash
    const companyInfo = companyInformation.filter((list) => !list.custom && list.fieldType !== 'files')
    const companyExtraInfo = companyInformation.filter((list) => !!list.custom)
    // company field
    if (companyInfo.length) {
      companyInfo.forEach((item: any) => {
        b2bFields[toHump(deCodeField(item.name))] = item?.default || ''
      })
    }

    // Company Additional Field
    if (companyExtraInfo.length) {
      const extraFields:Array<CustomFieldItems> = []
      companyExtraInfo.forEach((item: CustomFieldItems) => {
        const itemExtraField: CustomFieldItems = {}
        itemExtraField.fieldName = deCodeField(item.name)
        itemExtraField.fieldValue = item?.default || ''
        extraFields.push(itemExtraField)
      })
      b2bFields.extraFields = extraFields
    }

    b2bFields.companyEmail = data.email

    // address Field
    const addressBasicInfo = addressBasicList.filter((list) => !list.custom)
    const addressExtraBasicInfo = addressBasicList.filter((list) => !!list.custom)

    if (addressBasicInfo.length) {
      addressBasicInfo.forEach((field: CustomFieldItems) => {
        const name = deCodeField(field.name)
        if (name === 'address1') {
          b2bFields.addressLine1 = field.default
        }
        if (name === 'address2') {
          b2bFields.addressLine2 = field.default
        }
        b2bFields[name] = field.default
      })
    }

    // address Additional Field
    if (addressExtraBasicInfo.length) {
      const extraFields:Array<CustomFieldItems> = []
      addressExtraBasicInfo.forEach((item: CustomFieldItems) => {
        const itemExtraField: CustomFieldItems = {}
        itemExtraField.fieldName = deCodeField(item.name)
        itemExtraField.fieldValue = item?.default || ''
        extraFields.push(itemExtraField)
      })
      b2bFields.addressExtraFields = extraFields
    }
    b2bFields.fileList = fileList

    return createB2BCompanyUser(b2bFields)
  }

  const getFileUrl = async (attachmentsList: RegisterFields[]) => {
    let attachments: File[] = []

    if (!attachmentsList.length) return

    attachmentsList.forEach((field: any) => {
      attachments = field.default
    })

    try {
      const fileResponse = await Promise.all(attachments.map(
        (file: File) => uploadB2BFile({
          file,
          type: 'companyAttachedFile',
        }),
      ))

      const fileList = fileResponse.reduce((fileList: any, res: any) => {
        if (res.code === 200) {
          fileList = [...fileList, res.data]
        } else {
          throw res.data.errMsg || res.message || b3Lang('intl.global.fileUpload.fileUploadFailure')
        }
        return fileList
      }, [])

      return fileList
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error)
      throw error
    }
  }

  const saveRegisterPassword = (data: CustomFieldItems) => {
    const newPasswordInformation = passwordInformation.map((field: RegisterFields) => {
      if (accountType === '1') {
        field.default = data[field.name] || field.default
      }
      return field
    })

    const newBcPasswordInformation = bcPasswordInformation.map((field: RegisterFields) => {
      if (accountType === '2') {
        field.default = data[field.name] || field.default
      }

      return field
    })

    dispatch({
      type: 'all',
      payload: {
        passwordInformation: newPasswordInformation,
        bcPasswordInformation: newBcPasswordInformation,
      },
    })
  }

  const handleCompleted = (event: MouseEvent) => {
    // if (captchaMessage !== 'success') return
    handleSubmit(async (completeData: CustomFieldItems) => {
      if (completeData.password !== completeData.confirmPassword) {
        setError(
          'confirmPassword',
          {
            type: 'manual',
            message: b3Lang('intl.user.register.RegisterComplete.passwordMatchPrompt'),
          },
        )
        setError(
          'password',
          {
            type: 'manual',
            message: b3Lang('intl.user.register.RegisterComplete.passwordMatchPrompt'),
          },
        )
        return
      }
      try {
        dispatch({
          type: 'loading',
          payload: {
            isLoading: true,
          },
        })

        let isAuto = true
        if (accountType === '2') {
          await getBCFieldsValue(completeData)
        } else {
          const attachmentsList = companyInformation.filter((list) => list.fieldType === 'files')
          const fileList = await getFileUrl(attachmentsList || [])
          const res = await getBCFieldsValue(completeData)
          const {
            data,
          } = res
          const accountInfo = await getB2BFieldsValue(completeData, (data as any)[0].id, fileList)

          const {
            companyCreate: {
              company: {
                companyStatus,
              },
            },
          } = accountInfo
          isAuto = +companyStatus === 1
        }
        dispatch({
          type: 'finishInfo',
          payload: {
            submitSuccess: true,
            isAutoApproval: isAuto,
          },
        })
        saveRegisterPassword(completeData)
        handleNext()
      } catch (err: any) {
        setErrorMessage(err?.message || err)
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

  // const captcha = useMemo(() => (
  //   <Captcha
  //     size="normal"
  //     siteKey={captchaSetkey}
  //     onSuccess={() => setCaptchaMessage('success')}
  //   />
  // ), [])

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
        <InformationFourLabels>{ passwordName }</InformationFourLabels>
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

      {/* <Box
        sx={{
          mt: 4,
        }}
      >
        {captcha}
      </Box> */}

      <RegisteredStepButton
        handleBack={handleBack}
        activeStep={activeStep}
        handleNext={handleCompleted}
      />
    </Box>
  )
}
