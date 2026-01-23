export interface RegisterFields extends Record<string, any> {
  name: string;
  label?: string;
  required?: boolean;
  fieldType?: string;
  default?: string | any[] | number;
}
