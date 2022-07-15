import {
  TextField,
} from '@mui/material'
import { Controller } from 'react-hook-form'
import B3UI from './ui'

export const B3TextField = ({ control, errors, ...rest } : B3UI.B3UIProps) => {
  const {
    fieldType, name, default: defaultValue, required, label, validate, variant, rows,
    min, max, minLength, maxLength, fullWidth, muiTextFieldProps,
  } = rest

  const fieldsProps = {
    type: fieldType,
    name,
    key: name,
    defaultValue,
    rules: {
      required: required && `${label} is required`,
      validate,
    },
    control,
  }

  const textField = {
    type: fieldType,
    name,
    label,
    key: name,
    rows,
    multiline: fieldType === 'multiline',
    variant: variant || 'filled',
    fullWidth: fullWidth || true,
  }

  const inputProps = {
    min,
    max,
    maxLength,
    minLength,
  }

  const muiAttributeProps = muiTextFieldProps ? { ...muiTextFieldProps, ...inputProps } : { ...inputProps }

  return (
    <>
      {
        ['text', 'number', 'password', 'multiline'].includes(fieldType) && (
        <Controller
          {...fieldsProps}
          render={({ field }) => (
            <TextField
              {...textField}
              {...field}
              inputProps={muiAttributeProps}
              error={!!errors[name]}
              helperText={(errors as any)[name] ? (errors as any)[name].message : null}
            />
          )}
        />
        )
      }
    </>
  )
}
