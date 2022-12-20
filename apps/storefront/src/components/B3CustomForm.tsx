import {
  Grid,
} from '@mui/material'
import {
  B3ControlTextField,
  B3ControlCheckbox,
  B3ControlRadioGroup,
  B3ControlSelect,
  B3ControlPicker,
  B3ControlFileUpload,
  B3ControlRectangle,
  B3ControlProductRadio,
  B3ControlSwatchRadio,
} from './form'

import B3UI from './form/ui'

export function B3CustomForm(props: B3UI.B3CustomFormProps) {
  const {
    formFields,
    errors,
    control,
    getValues,
    setValue,
  } = props

  const renderFormFields = (fields: any) => (fields.map(((field: B3UI.B3CustomFormValue) => {
    const {
      fieldType,
    } = field
    return (
      <Grid
        item
        key={field.name}
        xs={field.xs || 6}
      >
        <>
          {['text', 'number', 'password', 'multiline'].includes(fieldType) && (
          <B3ControlTextField
            {...field}
            errors={errors}
            control={control}
          />
          )}
          {
            ['checkbox'].includes(fieldType) && (
              <B3ControlCheckbox
                {...field}
                errors={errors}
                control={control}
                getValues={getValues}
              />
            )
          }
          {
            ['radio'].includes(fieldType) && (
              <B3ControlRadioGroup
                {...field}
                errors={errors}
                control={control}
              />
            )
          }
          {
            ['dropdown'].includes(fieldType) && (
              <B3ControlSelect
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )
          }
          {
            ['date'].includes(fieldType) && (
              <B3ControlPicker
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
                getValues={getValues}
              />
            )
          }
          {
            ['files'].includes(fieldType) && (
              <B3ControlFileUpload
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )
          }
          {
            ['rectangle'].includes(fieldType) && (
              <B3ControlRectangle
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )
          }
          {
            ['productRadio'].includes(fieldType) && (
              <B3ControlProductRadio
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )
          }
          {
            ['swatch'].includes(fieldType) && (
              <B3ControlSwatchRadio
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )
          }
        </>
      </Grid>
    )
  })))

  return (
    <Grid
      container
      spacing={2}
    >
      {
        formFields && renderFormFields(formFields)
      }
    </Grid>
  )
}
