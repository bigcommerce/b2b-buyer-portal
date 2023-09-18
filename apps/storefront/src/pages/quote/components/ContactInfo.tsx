import { forwardRef, useEffect, useImperativeHandle } from 'react'
import { useForm } from 'react-hook-form'
import { LangFormatFunction, useB3Lang } from '@b3/lang'
import { Box } from '@mui/material'
import trim from 'lodash-es/trim'

import { B3CustomForm } from '@/components'
import { useMobile } from '@/hooks'
import { checkUserBCEmail, checkUserEmail } from '@/shared/service/b2b'
import { validatorRules } from '@/utils'

// import {
//   CustomerInfo,
// } from '@/shared/global/context/config'

const emailValidate = validatorRules(['email'])

const getContactInfo = (isMobile: boolean, b3Lang: LangFormatFunction) => {
  const contactInfo = [
    {
      name: 'name',
      label: b3Lang('quoteDraft.contactInfo.contactPerson'),
      required: true,
      default: '',
      fieldType: 'text',
      xs: isMobile ? 12 : 6,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'email',
      label: b3Lang('quoteDraft.contactInfo.email'),
      required: true,
      default: '',
      fieldType: 'text',
      xs: isMobile ? 12 : 6,
      variant: 'filled',
      size: 'small',
      validate: emailValidate,
    },
    {
      name: 'companyName',
      label: b3Lang('quoteDraft.contactInfo.companyName'),
      required: false,
      default: '',
      fieldType: 'text',
      xs: isMobile ? 12 : 6,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'phoneNumber',
      label: b3Lang('quoteDraft.contactInfo.phone'),
      required: false,
      default: '',
      fieldType: 'text',
      xs: isMobile ? 12 : 6,
      variant: 'filled',
      size: 'small',
    },
  ]

  return contactInfo
}

interface ContactInfoProps {
  info: {
    [key: string]: string
  }
  isB2BUser: boolean
  currentChannelId: string | number
  emailAddress?: string
}

function ContactInfo(
  { info = {}, isB2BUser, currentChannelId, emailAddress }: ContactInfoProps,
  ref: any
) {
  const {
    control,
    getValues,
    setError,
    formState: { errors },
    setValue,
    handleSubmit,
  } = useForm({
    mode: 'onSubmit',
  })

  const [isMobile] = useMobile()

  const b3Lang = useB3Lang()

  useEffect(() => {
    if (info && JSON.stringify(info) !== '{}') {
      Object.keys(info).forEach((item: string) => {
        setValue(item, info[item])
      })
    }
  }, [info])

  const validateEmailValue = async (emailValue: string) => {
    if (emailAddress === trim(emailValue)) return true
    const fn = isB2BUser ? checkUserEmail : checkUserBCEmail
    const key = isB2BUser ? 'userEmailCheck' : 'customerEmailCheck'

    const {
      [key]: { userType },
    }: CustomFieldItems = await fn({
      email: emailValue,
      channelId: currentChannelId,
    })

    const isValid = isB2BUser ? [1].includes(userType) : ![2].includes(userType)

    if (!isValid) {
      setError('email', {
        type: 'custom',
        message: b3Lang('quoteDraft.contactInfo.emailExists'),
      })
    }

    return isValid
  }

  const getContactInfoValue = async () => {
    let isValid = true
    await handleSubmit(
      async (data) => {
        isValid = await validateEmailValue(data.email)
      },
      () => {
        isValid = false
      }
    )()

    return isValid ? getValues() : isValid
  }

  useImperativeHandle(ref, () => ({
    getContactInfoValue,
  }))

  const contactInfo = getContactInfo(isMobile, b3Lang)

  return (
    <Box width="100%">
      <Box
        sx={{
          fontWeight: 400,
          fontSize: '24px',
          height: '32px',
          mb: '20px',
        }}
      >
        {b3Lang('quoteDraft.contactInfo.contact')}
      </Box>

      <B3CustomForm
        formFields={contactInfo}
        errors={errors}
        control={control}
        getValues={getValues}
        setValue={setValue}
      />
    </Box>
  )
}

export default forwardRef(ContactInfo)
