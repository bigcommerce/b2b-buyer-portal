import { FieldValues } from 'react-hook-form';
import { Grid } from '@mui/material';

import B3UI from './form/ui';
import {
  B2BControlMultiTextField,
  B3ControlAutocomplete,
  B3ControlCheckbox,
  B3ControlFileUpload,
  B3ControlPicker,
  B3ControlProductRadio,
  B3ControlRadioGroup,
  B3ControlRectangle,
  B3ControlSelect,
  B3ControlSwatchRadio,
  B3ControlTextField,
} from './form';

export default function B3CustomForm<T extends FieldValues>(props: B3UI.B3CustomFormProps<T>) {
  const { formFields, errors, control, getValues, setValue, setError } = props;

  const renderFormFields = (fields: B3UI.B3CustomFormValue<T>[]) =>
    fields.map((field) => {
      const { fieldType } = field;
      return (
        <Grid item key={field.name} xs={field.xs || 6} id="b3-customForm-id-name">
          <>
            {(fieldType === 'text' ||
              fieldType === 'number' ||
              fieldType === 'password' ||
              fieldType === 'multiline') && (
              <B3ControlTextField {...field} {...props} errors={errors} control={control} />
            )}
            {fieldType === 'checkbox' && (
              <B3ControlCheckbox
                {...field}
                errors={errors}
                control={control}
                getValues={getValues}
              />
            )}
            {fieldType === 'radio' && (
              <B3ControlRadioGroup {...field} errors={errors} control={control} />
            )}
            {fieldType === 'dropdown' && (
              <B3ControlSelect {...field} errors={errors} control={control} setValue={setValue} />
            )}
            {fieldType === 'date' && (
              <B3ControlPicker
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
                getValues={getValues}
              />
            )}
            {fieldType === 'files' && (
              <B3ControlFileUpload
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
                setError={setError}
              />
            )}
            {fieldType === 'rectangle' && (
              <B3ControlRectangle {...field} errors={errors} control={control} />
            )}
            {fieldType === 'productRadio' && (
              <B3ControlProductRadio {...field} errors={errors} control={control} />
            )}
            {fieldType === 'swatch' && (
              <B3ControlSwatchRadio {...field} errors={errors} control={control} />
            )}
            {fieldType === 'roleAutocomplete' && (
              <B3ControlAutocomplete
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
                getValues={getValues}
              />
            )}
            {fieldType === 'multiInputText' && (
              <B2BControlMultiTextField
                {...props}
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
                getValues={getValues}
              />
            )}
          </>
        </Grid>
      );
    });

  return (
    <Grid container spacing={2}>
      {formFields && renderFormFields(formFields)}
    </Grid>
  );
}
