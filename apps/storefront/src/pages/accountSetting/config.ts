interface ShippingListStatusProps {
  label: string
  value: number
}

export interface GetFilterMoreListProps {
  options?: Array<ShippingListStatusProps>
  rows?: string | number
  name: string
  label: string
  required: boolean
  default: string
  fieldType: string
  xs: number
  variant: string
  size: string
}

interface GetAccountSettingFilesReturnProps {
  accountB2BFormFields: GetFilterMoreListProps[]
  passwordModified: GetFilterMoreListProps[]
}

interface PasswordKeysProps {
  name: string
  label: string
}

export const getPasswordKeys = (): PasswordKeysProps[] => [
  {
    name: 'currentPassword',
    label: 'Current Password',
  },
  {
    name: 'password',
    label: 'Password',
  },
  {
    name: 'confirmPassword',
    label: 'Confirm Password',
  },
]

export const getAccountSettingFiles = (
  xs: number
): GetAccountSettingFilesReturnProps => {
  const accountB2BFormFields = [
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
  ]

  const passwordModified = getPasswordKeys().map((item: PasswordKeysProps) => ({
    name: item.name,
    label: item.label,
    required: false,
    default: '',
    fieldType: 'password',
    xs,
    variant: 'filled',
    size: 'small',
  }))

  return {
    accountB2BFormFields,
    passwordModified,
  }
}
