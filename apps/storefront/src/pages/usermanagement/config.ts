import { LangFormatFunction } from '@b3/lang';

interface ExtraFieldsProps {
  fieldName: string;
  fieldValue: string | number;
}

interface UsersListItems {
  createdAt: number;
  email: string;
  firstName: string;
  id: string;
  lastName: string;
  phone: string;
  role: number;
  updatedAt: number;
  extraFields: ExtraFieldsProps[];
  [key: string]: string | null | number | ExtraFieldsProps[];
}

interface FilterProps {
  first: number;
  offset: number;
  search: string;
  role: number | string;
  companyId: number | string;
  addChannel: boolean;
  [key: string]: string | null | number | boolean | ExtraFieldsProps[];
}

type UsersList = UsersListItems;

interface UsersFilesProps {
  [key: string]: string | boolean | number | Array<any> | boolean | undefined;
  name: string;
}

interface UserRoleProps {
  label: string;
  value: number;
  idLang: string;
}

const getUserRole = () => {
  const userRole: Array<UserRoleProps> = [
    {
      label: 'Admin',
      value: 0,
      idLang: 'userManagement.userRole.admin',
    },
    {
      label: 'Senior buyer',
      value: 1,
      idLang: 'userManagement.userRole.seniorBuyer',
    },
    {
      label: 'Junior buyer',
      value: 2,
      idLang: 'userManagement.userRole.juniorBuyer',
    },
  ];

  return userRole;
};

const getFilterMoreList = (b3Lang: LangFormatFunction) => {
  return [
    {
      name: 'role',
      label: b3Lang('userManagement.config.userRole'),
      required: false,
      default: '',
      fieldType: 'dropdown',
      options: getUserRole(),
      xs: 12,
      disabled: false,
      variant: 'filled',
      size: 'small',
    },
  ] satisfies [unknown];
};

const getUsersFiles = (type: string, b3Lang: LangFormatFunction, disabledUserRole = false) => {
  const roleArr = getFilterMoreList(b3Lang);
  roleArr[0].required = true;
  roleArr[0].disabled = disabledUserRole;

  const usersFiles = [
    ...roleArr,
    {
      name: 'email',
      label: b3Lang('userManagement.config.email'),
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
      label: b3Lang('userManagement.config.firstName'),
      required: true,
      default: '',
      fieldType: 'text',
      xs: 6,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'lastName',
      label: b3Lang('userManagement.config.lastName'),
      required: true,
      fieldType: 'text',
      xs: 6,
      default: '',
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'phone',
      label: b3Lang('userManagement.config.phoneNumber'),
      required: false,
      fieldType: 'text',
      xs: 12,
      default: '',
      variant: 'filled',
      size: 'small',
    },
  ];

  return usersFiles;
};

type EmailError = {
  [k: number]: string;
};

const emailError: EmailError = {
  3: 'global.emailValidate.multipleCustomer',
  4: 'global.emailValidate.companyUsed',
  5: 'global.emailValidate.alreadyExits',
  6: 'global.emailValidate.usedSuperAdmin',
};

export { emailError, getFilterMoreList, getUserRole, getUsersFiles };

export type { FilterProps, UserRoleProps, UsersFilesProps, UsersList, ExtraFieldsProps };
