interface UsersListItems {
  createdAt: number
  email: string
  firstName: string
  id: string
  lastName: string
  phone: string
  role: number
  updatedAt: number
  [key: string]: string | null | number
}

interface FilterProps {
  first: number
  offset: number
  search: string
  role: number | string
  companyId: number | string
  addChannel: boolean
  [key: string]: string | null | number | boolean
}

type UsersList = UsersListItems

interface UsersFilesProps {
  [key: string]: string | boolean | number | Array<any> | boolean | undefined
  name: string
}

interface UserRoleProps {
  label: string
  value: number
}

const getUserRole = () => {
  const userRole: Array<UserRoleProps> = [
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
  ]

  return userRole
}

const getFilterMoreList = () => {
  const filterMoreList = [
    {
      name: 'role',
      label: 'User role',
      required: false,
      default: '',
      fieldType: 'dropdown',
      options: getUserRole(),
      xs: 12,
      disabled: false,
      variant: 'filled',
      size: 'small',
    },
  ]

  return filterMoreList
}

const getUsersFiles = (type: string, disabledUserRole = false) => {
  const roleArr = [...getFilterMoreList()]
  roleArr[0].required = true
  roleArr[0].disabled = disabledUserRole
  const usersFiles = [
    ...roleArr,
    {
      name: 'email',
      label: 'Email',
      required: true,
      fieldType: 'text',
      xs: 12,
      disabled: type === 'edit',
      default: '',
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'firstName',
      label: 'First name',
      required: true,
      default: '',
      fieldType: 'text',
      xs: 6,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'lastName',
      label: 'Last name',
      required: true,
      fieldType: 'text',
      xs: 6,
      default: '',
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'phone',
      label: 'Phone number',
      required: false,
      fieldType: 'text',
      xs: 12,
      default: '',
      variant: 'filled',
      size: 'small',
    },
  ]

  return usersFiles
}

type EmailError = {
  [k: number]: string
}

const emailError: EmailError = {
  3: 'intl.user.addUser.emailValidate.multipleCustomer',
  4: 'intl.user.addUser.emailValidate.companyUsed',
  5: 'intl.user.addUser.emailValidate.alreadyExits',
  6: 'intl.user.addUser.emailValidate.usedSuperAdmin',
}

export { emailError, getFilterMoreList, getUserRole, getUsersFiles }

export type { FilterProps, UserRoleProps, UsersFilesProps, UsersList }
