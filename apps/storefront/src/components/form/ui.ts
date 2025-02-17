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
  type SpecificB3CustomFormValue =
    | (MultiTextFieldProps & { fieldType: 'multiInputText' })
    | (RadioGroupFieldProps & { fieldType: 'radio' })
    | (CheckboxFieldProps & { fieldType: 'checkbox' })
    | TextFieldProps
    | (SelectFieldProps & { fieldType: 'dropdown' })
    | (PickerFieldProps & { fieldType: 'date' })
    | (FileUploadProps & { fieldType: 'files' })
    | (RectangleProps & { fieldType: 'rectangle' })
    | (ProductRadioProps & { fieldType: 'productRadio' })
    | (SwatchRadioProps & { fieldType: 'swatch' })
    | (AutocompleteProps & { fieldType: 'roleAutocomplete' });

  export type B3CustomFormValue = SpecificB3CustomFormValue & { xs?: number };

  export interface B3CustomFormProps {
    formFields?: B3CustomFormValue[];
    [key: string]: any;
  }
}

export default Form;
