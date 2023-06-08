import { KeyboardEvent, WheelEvent } from 'react'
import { Controller } from 'react-hook-form'
import { useB3Lang } from '@b3/lang'
import { Box, TextField } from '@mui/material'

import { StyleNumberTextField } from './styled'
import Form from './ui'

export default function B3ControlTextField({
  control,
  errors,
  ...rest
}: Form.B3UIProps) {
  const {
    fieldType,
    name,
    default: defaultValue,
    required,
    label,
    validate,
    variant,
    rows,
    min,
    max,
    minLength,
    maxLength,
    fullWidth,
    muiTextFieldProps,
    disabled,
    labelName,
    size,
    readOnly,
    allowArrow = false,
    sx = {},
  } = rest

  const b3Lang = useB3Lang()

  let requiredText = ''
  if (fieldType === 'password') {
    requiredText = b3Lang('intl.global.validate.password.required')
  } else {
    requiredText = b3Lang('intl.global.validate.required', {
      label: labelName || label,
    })
  }

  const fieldsProps = {
    type: fieldType,
    name,
    key: name,
    defaultValue,
    rules: {
      required: required && requiredText,
      validate: validate && ((v: string) => validate(v, b3Lang)),
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
    variant,
    fullWidth: fullWidth || true,
    required,
    size,
  }

  const inputProps = {
    min,
    max,
    maxLength,
    minLength,
    readOnly,
  }

  const muiAttributeProps = muiTextFieldProps
    ? {
        ...muiTextFieldProps,
        ...inputProps,
      }
    : {
        ...inputProps,
      }

  const handleNumberInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const keys = allowArrow
      ? ['KeyE', 'Period']
      : ['ArrowUp', 'ArrowDown', 'KeyE', 'Period']
    if (keys.indexOf(event.code) > -1) {
      event.preventDefault()
    }
  }

  const handleNumberInputWheel = (event: WheelEvent<HTMLInputElement>) => {
    ;(event.target as HTMLElement).blur()
  }

  return ['text', 'number', 'password', 'multiline'].includes(fieldType) ? (
    <>
      {labelName && (
        <Box
          sx={{
            mb: 1,
          }}
        >
          {`${labelName} :`}
        </Box>
      )}
      <Controller
        {...fieldsProps}
        render={({ field: { ...rest } }) =>
          fieldType === 'number' ? (
            <StyleNumberTextField
              {...textField}
              {...rest}
              sx={{
                color: disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.6)',
              }}
              allowarrow={allowArrow ? 1 : 0}
              inputProps={muiAttributeProps}
              error={!!errors[name]}
              helperText={
                (errors as any)[name] ? (errors as any)[name].message : null
              }
              onKeyDown={handleNumberInputKeyDown}
              onWheel={handleNumberInputWheel}
            />
          ) : (
            <TextField
              {...textField}
              {...rest}
              sx={{
                color: disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.6)',
                ...sx,
              }}
              inputProps={muiAttributeProps}
              error={!!errors[name]}
              helperText={
                (errors as any)[name] ? (errors as any)[name].message : null
              }
              autoComplete={fieldType === 'password' ? 'new-password' : 'off'}
            />
          )
        }
      />
    </>
  ) : null
}
