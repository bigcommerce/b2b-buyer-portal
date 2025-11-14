import { Grid } from '@mui/material';

import { B2BControlMultiTextField } from './form/B2BControlMultiTextField';
import { B3ControlAutocomplete } from './form/B3ControlAutocomplete';
import { B3ControlCheckbox } from './form/B3ControlCheckbox';
import { B3ControlFileUpload } from './form/B3ControlFileUpload';
import { B3ControlPicker } from './form/B3ControlPicker';
import { B3ControlProductRadio } from './form/B3ControlProductRadio';
import { B3ControlRadioGroup } from './form/B3ControlRadioGroup';
import { B3ControlRectangle } from './form/B3ControlRectangle';
import { B3ControlSelect } from './form/B3ControlSelect';
import { B3ControlSwatchRadio } from './form/B3ControlSwatchRadio';
import { B3ControlTextField } from './form/B3ControlTextField';
import B3UI from './form/ui';

export default function B3CustomForm(props: B3UI.B3CustomFormProps) {
  const { formFields, errors, control, getValues, setValue, setError } = props;

  const renderFormFields = (fields: any) =>
    fields.map((field: B3UI.B3CustomFormValue) => {
      const { fieldType } = field;
      return (
        <Grid item key={field.name} xs={field.xs || 6} id="b3-customForm-id-name">
          <>
            {['text', 'number', 'password', 'multiline'].includes(fieldType) && (
              <B3ControlTextField {...field} {...props} errors={errors} control={control} />
            )}
            {['checkbox'].includes(fieldType) && (
              <B3ControlCheckbox
                {...field}
                errors={errors}
                control={control}
                getValues={getValues}
              />
            )}
            {['radio'].includes(fieldType) && (
              <B3ControlRadioGroup {...field} errors={errors} control={control} />
            )}
            {['dropdown'].includes(fieldType) && (
              <B3ControlSelect {...field} errors={errors} control={control} setValue={setValue} />
            )}
            {['date'].includes(fieldType) && (
              <B3ControlPicker
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
                getValues={getValues}
              />
            )}
            {['files'].includes(fieldType) && (
              <B3ControlFileUpload
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
                setError={setError}
              />
            )}
            {['rectangle'].includes(fieldType) && (
              <B3ControlRectangle
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )}
            {['productRadio'].includes(fieldType) && (
              <B3ControlProductRadio
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )}
            {['swatch'].includes(fieldType) && (
              <B3ControlSwatchRadio
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )}
            {['roleAutocomplete'].includes(fieldType) && (
              <B3ControlAutocomplete
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
                getValues={getValues}
              />
            )}
            {['multiInputText'].includes(fieldType) && (
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
