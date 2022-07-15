import { ChangeEvent } from 'react'

import {
  FormControl,
  FormLabel,
  FormHelperText,
  MenuItem,
  Select,
} from '@mui/material'
import { Controller } from 'react-hook-form'

import B3UI from './ui'

export const B3Select = ({ control, errors, ...rest } : B3UI.B3UIProps) => {
  const {
    fieldType, name, default: defaultValue, required, label, validate, options,
    muiSelectProps, setValue, onChange, replaceOptions,
  } = rest

  const muiAttributeProps = muiSelectProps || {}

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

  const onHandleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange()
    setValue(name, e.target.value)
  }

  const onChangeProps = onChange ? { onChange: onHandleChange } : {}

  return (
    <>
      {
        ['dropdown'].includes(fieldType) && (
        <FormControl style={{ width: '100%' }}>
          {
            label && <FormLabel error={!!errors[name]} required={required}>{label}</FormLabel>
          }
          <Controller
            {...fieldsProps}
            render={({ field }) => (
              <Select
                {...field}
                {...muiAttributeProps}
                {...onChangeProps}
              >
                {
                  options?.length && (
                    options.map((option: any) => (
                      <MenuItem key={option[replaceOptions?.label || 'label']} value={option[replaceOptions?.value || 'value']}>{option[replaceOptions?.label || 'label']}</MenuItem>
                    ))
                  )
                  }
              </Select>
            )}
          />
          {
            errors[name] && (<FormHelperText error={!!errors[name]}>{errors[name] ? errors[name].message : null}</FormHelperText>)
          }
        </FormControl>
        )
      }
    </>
  )
}
