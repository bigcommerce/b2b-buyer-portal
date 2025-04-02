export interface GetFilterMoreListProps {
  name: string;
  fieldId: string;
  label: string;
  required?: true;
  disabled?: true;
  default?: string;
  fieldType: string;
}

export const getAccountSettingsFields = (): GetFilterMoreListProps[] => {
  return [
    {
      name: 'company',
      fieldId: 'field_company',
      label: 'Company',
      disabled: true,
      fieldType: 'text',
    },
    {
      name: 'role',
      fieldId: 'field_role',
      label: 'Role',
      disabled: true,
      fieldType: 'text',
    },
  ];
};

export const getPasswordModifiedFields = (): GetFilterMoreListProps[] => {
  return [
    {
      name: 'currentPassword',
      fieldId: 'field_current_password',
      label: 'Current Password',
      fieldType: 'password',
    },
    {
      name: 'password',
      fieldId: 'field_password',
      label: 'Password',
      fieldType: 'password',
    },
    {
      name: 'confirmPassword',
      fieldId: 'field_confirm_password',
      label: 'Confirm Password',
      fieldType: 'password',
    },
  ];
};
