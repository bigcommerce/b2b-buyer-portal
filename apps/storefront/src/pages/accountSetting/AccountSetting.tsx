import { useContext, useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { useB3Lang } from '@b3/lang'
import { Box } from '@mui/material'
import trim from 'lodash-es/trim'

import { B3CustomForm, B3Sping, CustomButton } from '@/components'
import {
  b3HexToRgb,
  getContrastColor,
} from '@/components/outSideComponents/utils/b3CustomStyles'
import { useMobile } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import {
  checkUserBCEmail,
  checkUserEmail,
  getB2BAccountFormFields,
  getB2BAccountSettings,
  getBCAccountSettings,
  updateB2BAccountSettings,
  updateBCAccountSettings,
} from '@/shared/service/b2b'
import { Fields, ParamProps } from '@/types/accountSetting'
import { B3SStorage, snackbar } from '@/utils'

import { deCodeField, getAccountFormFields } from '../registered/config'

import { getAccountSettingFiles } from './config'
import sendEmail, {
  b2bSubmitDataProcessing,
  bcSubmitDataProcessing,
  initB2BInfo,
  initBcInfo,
} from './utils'

function AccountSetting() {
  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
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
      companyInfo: { id: companyInfoId },
    },
  } = useContext(GlobaledContext)

  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)

  const b3Lang = useB3Lang()

  const [isMobile] = useMobile()

  const navigate = useNavigate()

  const [accountInfoFormFields, setAccountInfoFormFields] = useState<
    Partial<Fields>[]
  >([])

  const [decryptionFields, setDecryptionFields] = useState<Partial<Fields>[]>(
    []
  )

  const [extraFields, setExtraFields] = useState<Partial<Fields>[]>([])

  const [isloadding, setLoadding] = useState<boolean>(false)

  const [accountSettings, setAccountSettings] = useState<any>({})

  const [isVisible, setIsVisible] = useState<boolean>(false)

  const [currentEamil, setCurrentEmail] = useState<string>('')

  const companyId =
    role === 3 && isAgenting ? +salesRepCompanyId : +companyInfoId

  const isBCUser = !isB2BUser || (role === 3 && !isAgenting)

  useEffect(() => {
    const init = async () => {
      try {
        setLoadding(true)

        const accountFormAllFields = await getB2BAccountFormFields(
          isBCUser ? 1 : 2
        )

        const fn = !isBCUser ? getB2BAccountSettings : getBCAccountSettings

        const params = !isBCUser
          ? {
              companyId,
            }
          : {}

        const key = !isBCUser ? 'accountSettings' : 'customerAccountSettings'

        const { [key]: accountSettings } = await fn(params)

        const accountFormFields = getAccountFormFields(
          accountFormAllFields.accountFormFields || []
        )
        const { accountB2BFormFields, passwordModified } =
          getAccountSettingFiles(12, b3Lang)

        const contactInformation = (
          accountFormFields?.contactInformation || []
        ).filter(
          (item: Partial<Fields>) =>
            item.fieldId !== 'field_email_marketing_newsletter'
        )

        const contactInformationTranslatedLabels = JSON.parse(
          JSON.stringify(contactInformation)
        )

        contactInformationTranslatedLabels.forEach(
          (element: { fieldId: string; label: string }) => {
            const currentElement = element
            if (currentElement.fieldId === 'field_first_name') {
              currentElement.label = b3Lang('accountSettings.form.firstName')
            }
            if (currentElement.fieldId === 'field_last_name') {
              currentElement.label = b3Lang('accountSettings.form.lastName')
            }
            if (currentElement.fieldId === 'field_email') {
              currentElement.label = b3Lang('accountSettings.form.email')
            }
            if (currentElement.fieldId === 'field_phone_number') {
              currentElement.label = b3Lang('accountSettings.form.phoneNumber')
            }
          }
        )

        const { additionalInformation = [] } = accountFormFields

        const fields = !isBCUser
          ? initB2BInfo(
              accountSettings,
              contactInformationTranslatedLabels,
              accountB2BFormFields,
              additionalInformation
            )
          : initBcInfo(
              accountSettings,
              contactInformationTranslatedLabels,
              additionalInformation
            )

        const passwordModifiedTranslatedFields = JSON.parse(
          JSON.stringify(passwordModified)
        ).map((element: { label: string; idLang: string }) => {
          const passwordField = element
          passwordField.label = b3Lang(element.idLang)

          return element
        })

        const all = [...fields, ...passwordModifiedTranslatedFields]

        setAccountInfoFormFields(all)

        setCurrentEmail(accountSettings.email)

        setAccountSettings(accountSettings)

        setDecryptionFields(contactInformation)

        setExtraFields(additionalInformation)
      } finally {
        if (B3SStorage.get('isFinshUpdate') === '1') {
          snackbar.success(
            b3Lang('accountSettings.notification.detailsUpdated')
          )
          B3SStorage.delete('isFinshUpdate')
        }
        setLoadding(false)
        setIsVisible(true)
      }
    }

    init()
  }, [])

  const validateEmailValue = async (emailValue: string) => {
    if (customer.emailAddress === trim(emailValue)) return true
    const fn = !isBCUser ? checkUserEmail : checkUserBCEmail
    const key = !isBCUser ? 'userEmailCheck' : 'customerEmailCheck'

    const {
      [key]: { userType },
    }: CustomFieldItems = await fn({
      email: emailValue,
      channelId: currentChannelId,
    })

    const isValid = !isBCUser ? [1].includes(userType) : ![2].includes(userType)

    if (!isValid) {
      setError('email', {
        type: 'custom',
        message: b3Lang('accountSettings.notification.emailExists'),
      })
    }

    return isValid
  }

  const passwordValidation = (data: Partial<ParamProps>) => {
    if (data.password !== data.confirmPassword) {
      setError('confirmPassword', {
        type: 'manual',
        message: b3Lang('global.registerComplete.passwordMatchPrompt'),
      })
      setError('password', {
        type: 'manual',
        message: b3Lang('global.registerComplete.passwordMatchPrompt'),
      })
      return false
    }

    return true
  }

  const emailValidation = (data: Partial<ParamProps>) => {
    if (data.email !== customer.emailAddress && !data.currentPassword) {
      snackbar.error(b3Lang('accountSettings.notification.updateEmailPassword'))
      return false
    }
    return true
  }

  const handleGetUserExtraFields = (data: CustomFieldItems) => {
    let userExtraFieldsInfo: CustomFieldItems[] = []
    const userExtraFields = accountInfoFormFields.filter(
      (item: CustomFieldItems) => item.custom && item.groupId === 1
    )
    if (userExtraFields.length > 0) {
      userExtraFieldsInfo = userExtraFields.map((item: CustomFieldItems) => ({
        fieldName: deCodeField(item?.name || ''),
        fieldValue: data[item.name],
      }))
    }

    return userExtraFieldsInfo
  }

  const handleAddUserClick = () => {
    handleSubmit(async (data: CustomFieldItems) => {
      setLoadding(true)

      try {
        const isValid = !isBCUser ? await validateEmailValue(data.email) : true

        const emailFlag = emailValidation(data)

        const passwordFlag = passwordValidation(data)

        let userExtraFields: CustomFieldItems[] = []
        if (!isBCUser) {
          userExtraFields = handleGetUserExtraFields(data)
        }

        const dataProcessingFn = !isBCUser
          ? b2bSubmitDataProcessing
          : bcSubmitDataProcessing

        if (isValid && emailFlag && passwordFlag) {
          const { isEdit, param } = dataProcessingFn(
            data,
            accountSettings,
            decryptionFields,
            extraFields
          )

          if (isEdit) {
            if (!isBCUser) {
              param.companyId = companyId
              param.extraFields = userExtraFields
            }

            const requestFn = !isBCUser
              ? updateB2BAccountSettings
              : updateBCAccountSettings

            if (
              (param.newPassword && param.currentPassword) ||
              currentEamil !== param.email
            ) {
              const isUpdateSuccessfully = await sendEmail(param, extraFields)
              if (!isUpdateSuccessfully) {
                snackbar.error(
                  b3Lang('accountSettings.notification.passwordNotMatch')
                )
                return
              }
            }
            const newParams = {
              ...param,
              newPassword: param.newPassword,
              currentPassword: param.newPassword,
              confirmPassword: param.newPassword,
            }
            await requestFn(newParams)
          } else {
            snackbar.success(b3Lang('accountSettings.notification.noEdits'))
            return
          }

          if (
            (data.password && data.currentPassword) ||
            customer.emailAddress !== trim(data.email)
          ) {
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
    <B3Sping isSpinning={isloadding} background={backgroundColor}>
      <Box
        sx={{
          width: `${isMobile ? '100%' : '35%'}`,
          minHeight: `${isMobile ? '800px' : '300px'}`,
          '& input, & .MuiFormControl-root .MuiTextField-root, & .MuiSelect-select.MuiSelect-filled, & .MuiTextField-root .MuiInputBase-multiline':
            {
              bgcolor: b3HexToRgb('#FFFFFF', 0.87),
              borderRadius: '4px',
              borderBottomLeftRadius: '0',
              borderBottomRightRadius: '0',
            },
          '& .MuiButtonBase-root.MuiCheckbox-root:not(.Mui-checked), & .MuiRadio-root:not(.Mui-checked)':
            {
              color: b3HexToRgb(getContrastColor(backgroundColor), 0.6),
            },
          '& .MuiTypography-root.MuiTypography-body1.MuiFormControlLabel-label, & .MuiFormControl-root .MuiFormLabel-root:not(.Mui-focused)':
            {
              color: b3HexToRgb(getContrastColor(backgroundColor), 0.87),
            },
          '& .MuiInputLabel-root.MuiInputLabel-formControl:not(.Mui-focused)': {
            color: b3HexToRgb(getContrastColor('#FFFFFF'), 0.6),
          },
        }}
      >
        <B3CustomForm
          formFields={accountInfoFormFields}
          errors={errors}
          control={control}
          getValues={getValues}
          setValue={setValue}
        />

        <CustomButton
          sx={{
            mt: '28px',
            mb: `${isMobile ? '20px' : '0'}`,
            width: '100%',
            visibility: `${isVisible ? 'visible' : 'hidden'}`,
          }}
          onClick={handleAddUserClick}
          variant="contained"
        >
          {b3Lang('accountSettings.button.saveUpdates')}
        </CustomButton>
      </Box>
    </B3Sping>
  )
}

export default AccountSetting
