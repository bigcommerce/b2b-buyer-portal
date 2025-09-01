import { LangFormatFunction } from '@/lib/lang';

export interface Fields {
  bcLabel: string;
  custom: boolean;
  default: string | number | CustomFieldItems[];
  defaultName?: string;
  fieldId: string;
  fieldType: string;
  groupId: number;
  groupName: string;
  id: string;
  label: string;
  max: string | number;
  maxLength: string | number;
  min: string | number;
  minlength: string | number;
  name: string;
  required: boolean;
  rows: string | number;
  type: string;
  validate: (val: string, b3lang: LangFormatFunction) => void | string;
  variant: string;
  visible: boolean;
  xs: number;
  muiSelectProps: CustomFieldItems;
  disabled: boolean;
}

interface BcFormFieldsProps {
  name: string;
  value: any;
}

export interface ParamProps {
  confirmPassword: string;
  currentPassword: string;
  password: string;
  firstName: string;
  lastName: string;
  emailAddress: string;
  email: string;
  companyId: string | number;
  formFields: BcFormFieldsProps[];
  [key: string]: string | CustomFieldItems[] | BcFormFieldsProps | number;
}
