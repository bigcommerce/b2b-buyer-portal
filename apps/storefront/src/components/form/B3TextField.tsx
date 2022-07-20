import {
  TextField,
} from '@mui/material'
import { Controller } from 'react-hook-form'
import Form from './ui'

export const B3TextField = ({ control, errors, ...rest } : Form.B3UIProps) => {
  const {
    fieldType, name, default: defaultValue, required, label, validate, variant, rows,
    min, max, minLength, maxLength, fullWidth, muiTextFieldProps, disabled,
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
    disabled,
    multiline: fieldType === 'multiline',
    variant: variant || 'filled',
    fullWidth: fullWidth || true,
    required,
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
