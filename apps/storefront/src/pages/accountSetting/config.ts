interface ShippingListStatusProps {
  label: string
  value: number
}

export interface GetFilterMoreListProps {
  options?: Array<ShippingListStatusProps>
  rows?: string | number,
  name: string
  label: string
  required: boolean
  default: string
  fieldType: string
  xs: number
  variant: string
  size: string
}

export const getAccountSettingFiles = (xs: number, isB2BUser?: boolean): GetFilterMoreListProps[] => {
  const accountFormFields = [
    {
      name: 'firstName',
      label: 'First Name',
      required: true,
      default: '',
      fieldType: 'text',
      xs,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      required: true,
      default: '',
      fieldType: 'text',
      xs,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'company',
      label: 'Company',
      required: false,
      default: '',
      fieldType: 'text',
      xs,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'phoneNumber',
      label: 'Phone Number',
      required: false,
      default: '',
      fieldType: 'text',
      xs,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'role',
      label: 'Role',
      required: false,
      default: '',
      fieldType: 'dropdown',
      options: [
        {
          label: 'Admin',
          value: 0,
        },
        {
          label: 'Senior buyer',
          value: 1,
        },
        {
          label: 'Junior buyer',
          value: 2,
        },
        {
          label: 'Super admin',
          value: 3,
        },
      ],
      xs,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'email',
      label: 'Email Address',
      required: true,
      default: '',
      fieldType: 'text',
      xs,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'currentPassword',
      label: 'Current Password',
      required: false,
      default: '',
      fieldType: 'password',
      xs,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'password',
      label: 'Password',
      required: false,
      default: '',
      fieldType: 'password',
      xs,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'confirmPassword',
      label: 'Confirm Password',
      required: false,
      default: '',
      fieldType: 'password',
      xs,
      variant: 'filled',
      size: 'small',
    },
  ]

  if (!isB2BUser) {
    return accountFormFields.filter((item:GetFilterMoreListProps) => item.name !== 'role')
  }
  return accountFormFields
}
