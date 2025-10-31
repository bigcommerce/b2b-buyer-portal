import { Control, FieldValues } from 'react-hook-form';

// eslint-disable-next-line @typescript-eslint/no-namespace
namespace Form {
  export interface B3CustomFormValue {
    name: string;
    fieldType: string;
    xs: number & undefined;
    [key: string]: string | number | Array<number | string>;
  }

  export interface B3CustomFormProps {
    formFields?: {}[];
    [key: string]: any;
  }

  export interface B3UIProps {
    control?: Control<FieldValues>;
    [key: string]: any;
  }

  export interface RadopGroupListProps {
    value: string;
    label: string;
    [key: string]: string;
  }

  export interface ProductRadioGroupListProps {
    value: string;
    label: string;
    image?: {
      alt: string;
      data: string;
    };
  }

  export interface SwatchRadioGroupListProps {
    value: string;
    label: string;
    colors?: string[];
    image?: {
      alt?: string;
      data?: string;
    };
  }
}

export default Form;
