import { Control } from 'react-hook-form';

import { MultiTextFieldProps } from './B2BControlMultiTextField';
import { CheckboxFieldProps } from './B3ControlCheckbox';
import { PickerFieldProps } from './B3ControlPicker';
import { RadioGroupFieldProps } from './B3ControlRadioGroup';
import { SelectFieldProps } from './B3ControlSelect';
import { TextFieldProps } from './B3ControlTextField';

namespace Form {
  interface VagueB3CustomFormValue {
    name: string;
    fieldType: 'files' | 'rectangle' | 'productRadio' | 'swatch' | 'roleAutocomplete';
    xs: number & undefined;
    [key: string]: string | number | Array<number | string>;
  }

  type SpecificB3CustomFormValue =
    | (MultiTextFieldProps & { fieldType: 'multiInputText' })
    | (RadioGroupFieldProps & { fieldType: 'radio' })
    | (CheckboxFieldProps & { fieldType: 'checkbox' })
    | TextFieldProps
    | (SelectFieldProps & { fieldType: 'dropdown' })
    | (PickerFieldProps & { fieldType: 'date' });

  export type B3CustomFormValue =
    | (SpecificB3CustomFormValue & { xs?: number })
    | VagueB3CustomFormValue;

  export interface B3CustomFormProps {
    formFields?: B3CustomFormValue[];
    [key: string]: any;
  }

  export interface B3UIProps {
    control?: Control<VagueB3CustomFormValue>;
    [key: string]: any;
  }

  export interface RadioGroupListProps {
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
