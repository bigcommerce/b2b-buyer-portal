import { Control, FieldValues } from 'react-hook-form';

import { MultiTextFieldProps } from './B2BControlMultiTextField';
import { AutocompleteProps } from './B3ControlAutocomplete';
import { CheckboxFieldProps } from './B3ControlCheckbox';
import { FileUploadProps } from './B3ControlFileUpload';
import { PickerFieldProps } from './B3ControlPicker';
import { ProductRadioProps } from './B3ControlProductRadio';
import { RadioGroupFieldProps } from './B3ControlRadioGroup';
import { RectangleProps } from './B3ControlRectangle';
import { SelectFieldProps } from './B3ControlSelect';
import { SwatchRadioProps } from './B3ControlSwatchRadio';
import { TextFieldProps } from './B3ControlTextField';

namespace Form {
  type SpecificB3CustomFormValue<T extends FieldValues> =
    | (MultiTextFieldProps<T> & { fieldType: 'multiInputText' })
    | (RadioGroupFieldProps<T> & { fieldType: 'radio' })
    | (CheckboxFieldProps<T> & { fieldType: 'checkbox' })
    | TextFieldProps<T>
    | (SelectFieldProps<T> & { fieldType: 'dropdown' })
    | (PickerFieldProps<T> & { fieldType: 'date' })
    | (FileUploadProps<T> & { fieldType: 'files' })
    | (RectangleProps<T> & { fieldType: 'rectangle' })
    | (ProductRadioProps<T> & { fieldType: 'productRadio' })
    | (SwatchRadioProps<T> & { fieldType: 'swatch' })
    | (AutocompleteProps<T> & { fieldType: 'roleAutocomplete' });

  export type B3CustomFormValue<T extends FieldValues> = SpecificB3CustomFormValue<T> & {
    xs?: number;
  };

  export interface B3CustomFormProps<T extends FieldValues> {
    formFields?: B3CustomFormValue<T>[];
    errors: any;
    control?: Control<T>;
    getValues: any;
    setValue: any;
    setError?: any;
  }
}

export default Form;
