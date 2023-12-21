import { LangFormatFunction } from '@b3/lang'

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
  idLang: string
}

export const getPasswordKeys = (): PasswordKeysProps[] => [
  {
    name: 'currentPassword',
    label: 'Current Password',
    idLang: 'accountSettings.form.currentPassword',
  },
  {
    name: 'password',
    label: 'Password',
    idLang: 'accountSettings.form.password',
  },
  {
    name: 'confirmPassword',
    label: 'Confirm Password',
    idLang: 'accountSettings.form.confirmPassword',
  },
]

export const getAccountSettingFiles = (
  xs: number,
  b3Lang: LangFormatFunction
): GetAccountSettingFilesReturnProps => {
  const accountB2BFormFields = [
    {
      name: 'company',
      label: b3Lang('accountSettings.form.company'),
      required: false,
      default: '',
      fieldType: 'text',
      xs,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'role',
      label: b3Lang('accountSettings.form.role'),
      required: false,
      default: '',
      fieldType: 'dropdown',
      options: [
        {
          label: b3Lang('accountSettings.form.admin'),
          value: 0,
        },
        {
          label: b3Lang('accountSettings.form.seniorBuyer'),
          value: 1,
        },
        {
          label: b3Lang('accountSettings.form.juniorBuyer'),
          value: 2,
        },
        {
          label: b3Lang('accountSettings.form.superAdmin'),
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
    idLang: item.idLang,
  }))

  return {
    accountB2BFormFields,
    passwordModified,
  }
}
