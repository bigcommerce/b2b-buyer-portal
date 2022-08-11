import {
  TextField,
} from '@mui/material'
import {
  Controller,
} from 'react-hook-form'
import {
  useB3Lang,
} from '@b3/lang'
import {
  KeyboardEvent,
  WheelEvent,
} from 'react'
import Form from './ui'
import {
  StyleNumberTextField,
} from './styled'

export const B3TextField = ({
  control,
  errors,
  ...rest
} : Form.B3UIProps) => {
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
  } = rest

  const b3Lang = useB3Lang()

  const fieldsProps = {
    type: fieldType,
    name,
    key: name,
    defaultValue,
    rules: {
      required: required && b3Lang('intl.global.validate.required', {
        label,
      }),
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

  const muiAttributeProps = muiTextFieldProps ? {
    ...muiTextFieldProps,
    ...inputProps,
  } : {
    ...inputProps,
  }

  const handleNumberInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (['ArrowUp', 'ArrowDown'].indexOf(event.code) > -1) {
      event.preventDefault()
    }
  }

  const handleNumberInputWheel = (event: WheelEvent<HTMLInputElement>) => {
    (event.target as HTMLElement).blur()
  }

  return (
    <>
      {
        [
          'text',
          'number',
          'password',
          'multiline',
        ].includes(fieldType) && (
          <Controller
            {...fieldsProps}
            render={({
              field: {
                ...rest
              },
            }) => (
              fieldType === 'number'
                ? (
                  <StyleNumberTextField
                    {...textField}
                    {...rest}
                    inputProps={muiAttributeProps}
                    error={!!errors[name]}
                    helperText={(errors as any)[name] ? (errors as any)[name].message : null}
                    onKeyDown={handleNumberInputKeyDown}
                    onWheel={handleNumberInputWheel}
                  />
                )
                : (
                  <TextField
                    {...textField}
                    {...rest}
                    inputProps={muiAttributeProps}
                    error={!!errors[name]}
                    helperText={(errors as any)[name] ? (errors as any)[name].message : null}
                  />
                )
            )}
          />
        )
      }
    </>
  )
}
