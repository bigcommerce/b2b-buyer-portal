import { LangFormatFunction } from '@b3/lang';

interface ShippingListStatusProps {
  label: string;
  value: number;
}

export interface GetFilterMoreListProps {
  options?: Array<ShippingListStatusProps>;
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

export const getAccountSettingsFields = (b3Lang: LangFormatFunction): GetFilterMoreListProps[] => {
  return [
    {
      name: 'company',
      label: b3Lang('accountSettings.form.company'),
      required: false,
      default: '',
      fieldType: 'text',
      xs: 12,
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
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
  ];
};

export const getPasswordModifiedFields = (b3Lang: LangFormatFunction): GetFilterMoreListProps[] => {
  return [
    {
      name: 'currentPassword',
      label: b3Lang('accountSettings.form.currentPassword'),
      required: false,
      default: '',
      fieldType: 'password',
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'password',
      label: b3Lang('accountSettings.form.password'),
      required: false,
      default: '',
      fieldType: 'password',
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
    {
      name: 'confirmPassword',
      label: b3Lang('accountSettings.form.confirmPassword'),
      required: false,
      default: '',
      fieldType: 'password',
      xs: 12,
      variant: 'filled',
      size: 'small',
    },
  ];
};
