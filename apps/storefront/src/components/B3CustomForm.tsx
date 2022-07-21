import { Grid } from '@mui/material'
import {
  B3TextField,
  B3Checkbox,
  B3RadioGroup,
  B3Select,
  B3Picker,
  B3FileUpload,
} from './form'

import B3UI from './form/ui'

export function B3CustomForm(props: B3UI.B3CustomFormProps) {
  const {
    formFields, errors, control, getValues, setValue,
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
          <B3TextField
            {...field}
            errors={errors}
            control={control}
          />
          )}
          {
            ['checkbox'].includes(fieldType) && (
              <B3Checkbox
                {...field}
                errors={errors}
                control={control}
                getValues={getValues}
              />
            )
          }
          {
            ['radio'].includes(fieldType) && (
              <B3RadioGroup
                {...field}
                errors={errors}
                control={control}
              />
            )
          }
          {
            ['dropdown'].includes(fieldType) && (
              <B3Select
                {...field}
                errors={errors}
                control={control}
                setValue={setValue}
              />
            )
          }
          {
            ['date'].includes(fieldType) && (
              <B3Picker
                {...field}
                errors={errors}
                control={control}
              />
            )
          }
          {
            ['file'].includes(fieldType) && (
              <B3FileUpload
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
