export enum RegisterAccountType {
  BUSINESS = '1',
  PERSONAL = '2',
}

export interface RegisterFields extends Record<string, any> {
  name: string;
  label?: string;
  required?: boolean;
  fieldType?: string;
  default?: string | Array<any> | number;
}
