import {
  useForm,
} from 'react-hook-form'
import {
  useEffect,
  forwardRef,
  useImperativeHandle,
} from 'react'
import {
  Box,
} from '@mui/material'
import {
  B3CustomForm,
} from '@/components'

import {
  useMobile,
} from '@/hooks'

// import {
//   CustomerInfo,
// } from '@/shared/global/context/config'

const getContactInfo = (isMobile: boolean) => {
  const contactInfo = [
    {
      name: 'name',
      label: 'Contact person',
      required: true,
      default: '',
      fieldType: 'text',
      xs: isMobile ? 12 : 6,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'email',
      label: 'Email',
      required: true,
      default: '',
      fieldType: 'text',
      xs: isMobile ? 12 : 6,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'phoneNumber',
      label: 'Phone',
      required: true,
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
    [key: string]: string,
  },
  // role: string | number,
  // customerInfo: CustomerInfo
}

const ContactInfo = ({
  info = {},
  // role,
  // customerInfo,
}: ContactInfoProps, ref: any) => {
  const {
    control,
    getValues,
    formState: {
      errors,
    },
    setValue,
    handleSubmit,
  } = useForm({
    mode: 'onSubmit',
  })

  const [isMobile] = useMobile()

  useEffect(() => {
    if (info && JSON.stringify(info) !== '{}') {
      Object.keys(info).forEach((item: string) => {
        setValue(item, info[item])
      })
    }
  }, [info])

  const getContactInfoValue = () => {
    handleSubmit(async (data) => data)()
    return getValues()
  }

  useImperativeHandle(ref, () => ({
    getContactInfoValue,
  }))

  const contactInfo = getContactInfo(isMobile)

  return (
    <Box
      width="100%"
    >
      <Box
        sx={{
          fontWeight: 400,
          fontSize: '24px',
          height: '32px',
          mb: '20px',
        }}
      >
        Contact

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
