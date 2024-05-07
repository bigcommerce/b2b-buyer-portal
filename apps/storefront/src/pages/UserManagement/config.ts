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
  companyRoleName: string;
  companyRoleId: number | string;
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
  name: string;
}

interface RoleCompanyInfoProps {
  id: number;
  name: string;
}

interface RoleProps {
  id: string;
  name: string;
  roleLevel: number;
  roleType: number;
  companyInfo: RoleCompanyInfoProps;
}

interface UserRoleListProps {
  node: RoleProps;
}

const getUserRole = () => {
  const userRole: Array<UserRoleProps> = [
    {
      label: 'Admin',
      name: 'Admin',
      value: 0,
      idLang: 'userManagement.userRole.admin',
    },
    {
      label: 'Senior buyer',
      name: 'Senior Buyer',
      value: 1,
      idLang: 'userManagement.userRole.seniorBuyer',
    },
    {
      label: 'Junior buyer',
      name: 'Junior Buyer',
      value: 2,
      idLang: 'userManagement.userRole.juniorBuyer',
    },
  ];

  return userRole;
};

const getFilterMoreList = (b3Lang: LangFormatFunction) => {
  return [
    {
      name: 'companyRoleId',
      label: b3Lang('userManagement.config.userRole'),
      required: false,
      default: '',
      defaultName: '',
      fieldType: 'roleAutocomplete',
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

export type {
  FilterProps,
  UserRoleProps,
  UsersFilesProps,
  UsersList,
  ExtraFieldsProps,
  UserRoleListProps,
  RoleCompanyInfoProps,
  RoleProps,
};
