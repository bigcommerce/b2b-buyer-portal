export interface GetFilterMoreListProps {
  fieldId: string;
  rows?: string | number;
  name: string;
  label: string;
  required: boolean;
  default: string;
  fieldType: string;
  xs: number;
  variant: string;
  size: string;
}

export const getAccountSettingsFields = (): GetFilterMoreListProps[] => {
  return [
    {
      name: 'company',
      fieldId: 'field_company',
      label: 'Company',
      required: false,
      default: '',
      fieldType: 'text',
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'role',
      fieldId: 'field_role',
      label: 'Role',
      required: false,
      default: '',
      fieldType: 'text',
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
  ];
};

export const getPasswordModifiedFields = (): GetFilterMoreListProps[] => {
  return [
    {
      name: 'currentPassword',
      fieldId: 'field_current_password',
      label: 'Current Password',
      required: false,
      default: '',
      fieldType: 'password',
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'password',
      fieldId: 'field_password',
      label: 'Password',
      required: false,
      default: '',
      fieldType: 'password',
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'confirmPassword',
      fieldId: 'field_confirm_password',
      label: 'Confirm Password',
      required: false,
      default: '',
      fieldType: 'password',
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
  ];
};
