import {
  TextField,
} from '@mui/material'
// import {
//   useState,
// } from 'react'
import {
  Controller,
} from 'react-hook-form'
import {
  useB3Lang,
} from '@b3/lang'
import {
  format,
} from 'date-fns'

import {
  LocalizationProvider,
} from '@mui/x-date-pickers/LocalizationProvider'
import {
  DesktopDatePicker,
} from '@mui/x-date-pickers/DesktopDatePicker'
import {
  AdapterDateFns,
} from '@mui/x-date-pickers/AdapterDateFns'
import Form from './ui'

import {
  PickerFormControl,
} from './styled'

export const B3ControlPicker = ({
  control,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
    muiTextFieldProps = {},
    setValue,
    variant,
    getValues,
  } = rest

  const b3Lang = useB3Lang()

  const {
    inputFormat = 'yyyy-MM-dd',
  } = muiTextFieldProps

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

  const muixPickerProps = muiTextFieldProps || {}

  const handleDatePickerChange = (value: Date) => {
    try {
      setValue(name, format(value, inputFormat))
    } catch (error) {
      setValue(name, value)
    }
  }

  return (
    <>
      {
        ['date'].includes(fieldType) && (
          <PickerFormControl>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <Controller
                {...fieldsProps}
                render={({
                  field: {
                    // eslint-disable-next-line @typescript-eslint/no-unused-vars
                    ref,
                    ...rest
                  },
                }) => (
                  <DesktopDatePicker
                    label={label}
                    inputFormat={inputFormat}
                    {...muixPickerProps}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        variant={variant || 'filled'}
                        required={required}
                        inputProps={{
                          readOnly: true,
                        }}
                        value={getValues(name) || defaultValue}
                        error={!!errors[name]}
                        helperText={(errors as any)[name] ? (errors as any)[name].message : null}
                      />
                    )}
                    {...rest}
                    onChange={handleDatePickerChange}
                  />
                )}
              />
            </LocalizationProvider>
          </PickerFormControl>
        )
      }
    </>
  )
}
