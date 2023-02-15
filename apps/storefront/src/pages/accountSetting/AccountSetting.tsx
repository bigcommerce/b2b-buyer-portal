import {
  useEffect,
  useContext,
  useState,
} from 'react'

import {
  Box,
  Button,
} from '@mui/material'

import {
  useForm,
} from 'react-hook-form'

import {
  trim,
} from 'lodash'
import {
  useB3Lang,
  B3Lang,
} from '@b3/lang'

import {
  useNavigate,
} from 'react-router-dom'
import {
  B3CustomForm,
} from '@/components'

import {
  useMobile,
} from '@/hooks'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  validatorRules,
  snackbar,
  B3SStorage,
} from '@/utils'

import {
  getB2BAccountFormFields,
  checkUserEmail,
  checkUserBCEmail,
  updateB2BAccountSettings,
  updateBCAccountSettings,
  getB2BAccountSettings,
  getBCAccountSettings,
} from '@/shared/service/b2b'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  getAccountFormFields,
  deCodeField,
} from '../../pages/registered/config'

import {
  getAccountSettingFiles,
} from './config'

interface Fields {
  bcLabel: string,
  custom: boolean,
  default: string | number | CustomFieldItems[]
  fieldId: string
  fieldType: string
  groupId: number
  groupName: string
  id: string
  label: string
  max: string | number
  maxLength: string | number
  min: string | number
  minlength: string | number
  name: string
  required: boolean,
  rows: string | number
  type: string
  validate: (val: string, b3lang: B3Lang) => void | string,
  variant: string
  visible: boolean,
  xs: number,
  muiSelectProps: CustomFieldItems
  disabled: boolean
}

interface BcFormFieldsProps {
  name: string,
  value: any,
}

interface ParamProps {
  confirmPassword: string
  currentPassword: string
  password: string
  firstName: string
  lastName: string
  emailAddress: string
  email: string
  companyId: string | number,
  formFields: BcFormFieldsProps[],
  [key: string]: string | CustomFieldItems[] | BcFormFieldsProps | number
}
const emailValidate = validatorRules(['email'])

const AccountSetting = () => {
  const {
    control,
    handleSubmit,
    getValues,
    formState: {
      errors,
    },
    setValue,
    setError,
  } = useForm({
    mode: 'onSubmit',
  })

  const {
    state: {
      role,
      isB2BUser,
      isAgenting,
      customer,
      currentChannelId,
      salesRepCompanyId,
      companyInfo: {
        id: companyInfoId,
      },
    },
  } = useContext(GlobaledContext)

  const b3Lang = useB3Lang()

  const [isMobile] = useMobile()

  const navigate = useNavigate()

  const [accountInfoFormFields, setAccountInfoFormFields] = useState<Partial<Fields>[]>([])

  const [decryptionFields, setDecryptionFields] = useState<Partial<Fields>[]>([])

  const [extraFields, setExtraFields] = useState<Partial<Fields>[]>([])

  const [isloadding, setLoadding] = useState<boolean>(false)

  const [accountSettings, setAccountSettings] = useState<any>({})

  const companyId = role === 3 && isAgenting ? +salesRepCompanyId : +companyInfoId

  useEffect(() => {
    const init = async () => {
      try {
        setLoadding(true)
        const accountFormAllFields = await getB2BAccountFormFields(isB2BUser ? 2 : 1)

        const fn = isB2BUser ? getB2BAccountSettings : getBCAccountSettings

        const params = isB2BUser ? {
          companyId,
        } : {}

        const key = isB2BUser ? 'accountSettings' : 'customerAccountSettings'

        const {
          [key]: accountSettings,
        } = await fn(params)

        const accountFormFields = getAccountFormFields(accountFormAllFields.accountFormFields || [])
        const {
          accountB2BFormFields,
          passwordModified,
        } = getAccountSettingFiles(12)

        const contactInformation = accountFormFields.contactInformation.filter((item: Partial<Fields>) => item.fieldId !== 'field_email_marketing_newsletter')

        const {
          additionalInformation,
        } = accountFormFields

        if (isB2BUser) {
          contactInformation.forEach((item: Partial<Fields>) => {
            if (deCodeField(item?.name || '') === 'first_name') {
              item.default = accountSettings.firstName
            }
            if (deCodeField(item?.name || '') === 'last_name') {
              item.default = accountSettings.lastName
            }
            if (deCodeField(item?.name || '') === 'phone') {
              item.default = accountSettings.phoneNumber
            }
            if (deCodeField(item?.name || '') === 'email') {
              item.default = accountSettings.email
              item.validate = emailValidate
            }
          })

          accountB2BFormFields.forEach((item: Partial<Fields>) => {
            if (item.name === 'role') {
              item.default = accountSettings.role
              item.muiSelectProps = {
                disabled: true,
              }
            } else if (item.name === 'company') {
              item.default = accountSettings.company
              item.disabled = true
            }
          })

          additionalInformation.forEach((item: Partial<Fields>) => {
            const formFields = (accountSettings?.formFields || []).find((field: Partial<Fields>) => field.name === item.bcLabel)
            if (formFields)item.default = formFields.value
          })

          const all = [
            ...contactInformation,
            ...accountB2BFormFields,
            ...additionalInformation,
            ...passwordModified,
          ]

          setAccountInfoFormFields(all)
        } else {
          contactInformation.forEach((item: Partial<Fields>) => {
            if (deCodeField(item?.name || '') === 'first_name') {
              item.default = accountSettings.firstName
            }
            if (deCodeField(item?.name || '') === 'last_name') {
              item.default = accountSettings.lastName
            }
            if (deCodeField(item?.name || '') === 'phone') {
              item.default = accountSettings.phoneNumber
            }
            if (deCodeField(item?.name || '') === 'email') {
              item.default = accountSettings.email
              item.validate = emailValidate
            }
            if (deCodeField(item?.name || '') === 'company') {
              item.default = accountSettings.company
            }
          })

          additionalInformation.forEach((item: Partial<Fields>) => {
            const formFields = (accountSettings?.formFields || []).find((field: Partial<Fields>) => field.name === item.bcLabel)
            if (formFields)item.default = formFields.value
          })

          const all = [
            ...contactInformation,
            ...additionalInformation,
            ...passwordModified,
          ]

          setAccountInfoFormFields(all)
        }

        setAccountSettings(accountSettings)

        setDecryptionFields(contactInformation)

        setExtraFields(additionalInformation)
      } finally {
        if (B3SStorage.get('isFinshUpdate') === '1') {
          snackbar.success('Your account details have been updated.')
          B3SStorage.delete('isFinshUpdate')
        }
        setLoadding(false)
      }
    }

    init()
  }, [])

  const validateEmailValue = async (emailValue: string) => {
    if (customer.emailAddress === trim(emailValue)) return true
    const fn = isB2BUser ? checkUserEmail : checkUserBCEmail
    const key = isB2BUser ? 'userEmailCheck' : 'customerEmailCheck'

    const {
      [key]: {
        userType,
      },
    }: CustomFieldItems = await fn({
      email: emailValue,
      channelId: currentChannelId,
    })

    const isValid = isB2BUser ? [1].includes(userType) : ![2].includes(userType)

    if (!isValid) {
      setError('email', {
        type: 'custom',
        message: 'Email already exists',
      })
    }

    return isValid
  }

  const passwordValidation = (data: Partial<ParamProps>) => {
    if (data.password !== data.confirmPassword) {
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
      return false
    }

    return true
  }

  const emailValidation = (data: Partial<ParamProps>) => {
    if ((data.email !== customer.emailAddress) && !data.currentPassword) {
      snackbar.error('Please type in your current password to update your email address.')
      return false
    }
    return true
  }

  const handleAddUserClick = () => {
    handleSubmit(async (data) => {
      setLoadding(true)

      try {
        const isValid = isB2BUser ? await validateEmailValue(data.email) : true

        const emailFlag = emailValidation(data)

        const passwordFlag = passwordValidation(data)

        let isEdit = true

        if (isValid && emailFlag && passwordFlag) {
          const param: Partial<ParamProps> = {}
          param.formFields = []
          let flag = true
          if (isB2BUser) {
            Object.keys(data).forEach((key: string) => {
              decryptionFields.forEach((item: Partial<Fields>) => {
                if (key === item.name) {
                  flag = false
                  if (deCodeField(item.name) === 'first_name') {
                    if (accountSettings.firstName !== data[item.name]) isEdit = false
                    param.firstName = data[item.name]
                  }
                  if (deCodeField(item.name) === 'last_name') {
                    if (accountSettings.lastName !== data[item.name]) isEdit = false
                    param.lastName = data[item.name]
                  }
                  if (deCodeField(item.name) === 'phone') {
                    if (accountSettings.phoneNumber !== data[item.name]) isEdit = false
                    param.phoneNumber = data[item.name]
                  }
                  if (deCodeField(item.name) === 'email') {
                    if (accountSettings.email !== data[item.name]) isEdit = false
                    param.email = data[item.name]
                  }
                }
              })

              if (flag) {
                extraFields.forEach((field: Partial<Fields>) => {
                  if (field.fieldId === key && param?.formFields) {
                    param.formFields.push({
                      name: field?.bcLabel || '',
                      value: data[key],
                    })
                    flag = false
                    const account = (accountSettings?.formFields || []).find((formField: Partial<Fields>) => formField.name === field.bcLabel)
                    if (account && JSON.stringify(account.value) !== JSON.stringify(data[key])) isEdit = false
                  }
                })
              }
              if (flag) {
                if (key === 'password') {
                  param.newPassword = data[key]
                  if (data[key]) isEdit = false
                } else {
                  param[key] = data[key]
                }
              }
              flag = true
            })

            delete param.company

            delete param.role

            param.companyId = companyId
            if (!isEdit) {
              await updateB2BAccountSettings(param)
            } else {
              snackbar.success('You haven’t made any edits')
              return
            }
          } else {
            Object.keys(data).forEach((key: string) => {
              decryptionFields.forEach((item: Partial<Fields>) => {
                if (key === item.name) {
                  flag = false
                  if (deCodeField(item.name) === 'first_name') {
                    if (accountSettings.firstName !== data[item.name]) isEdit = false
                    param.firstName = data[item.name]
                  }
                  if (deCodeField(item.name) === 'last_name') {
                    if (accountSettings.lastName !== data[item.name]) isEdit = false
                    param.lastName = data[item.name]
                  }
                  if (deCodeField(item.name) === 'phone') {
                    if (accountSettings.phoneNumber !== data[item.name]) isEdit = false
                    param.phoneNumber = data[item.name]
                  }
                  if (deCodeField(item.name) === 'email') {
                    if (accountSettings.email !== data[item.name]) isEdit = false
                    param.email = data[item.name]
                  }
                  if (deCodeField(item.name) === 'company') {
                    if (accountSettings.company !== data[item.name]) isEdit = false
                    param.company = data[item.name]
                  }
                }
              })

              if (flag) {
                extraFields.forEach((field: Partial<Fields>) => {
                  if (field.fieldId === key && param?.formFields) {
                    param.formFields.push({
                      name: field?.bcLabel || '',
                      value: data[key],
                    })
                    flag = false
                    const account = (accountSettings?.formFields || []).find((formField: Partial<Fields>) => formField.name === field.bcLabel)
                    if (account && JSON.stringify(account.value) !== JSON.stringify(data[key])) isEdit = false
                  }
                })
              }

              if (flag) {
                if (key === 'password') {
                  param.newPassword = data[key]
                  if (data[key]) isEdit = false
                } else {
                  param[key] = data[key]
                }
              }
              flag = true
            })

            if (!isEdit) {
              await updateBCAccountSettings(param)
            } else {
              snackbar.success('You haven’t made any edits')
              return
            }
          }
          if (data.password && data.currentPassword) {
            navigate('/login?loginFlag=3')
          } else {
            B3SStorage.clear()
            B3SStorage.set('isFinshUpdate', '1')
            window.location.reload()
          }
        }
      } finally {
        setLoadding(false)
      }
    })()
  }

  return (
    <B3Sping
      isSpinning={isloadding}
    >
      <Box
        sx={{
          width: `${isMobile ? '100%' : '35%'}`,
          minHeight: '300px',
        }}
      >
        <B3CustomForm
          formFields={accountInfoFormFields}
          errors={errors}
          control={control}
          getValues={getValues}
          setValue={setValue}
        />

        <Button
          sx={{
            mt: '28px',
            mb: `${isMobile ? '20px' : '0'}`,
            width: '100%',
          }}
          onClick={handleAddUserClick}
          variant="contained"
        >
          save updates
        </Button>
      </Box>

    </B3Sping>

  )
}

export default AccountSetting
