import { ChangeEvent } from 'react'
import { Controller } from 'react-hook-form'
import { useB3Lang } from '@b3/lang'
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
} from '@mui/material'

import Form from './ui'

export default function B3ControlSelect({
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
    options,
    muiSelectProps,
    setValue,
    onChange,
    replaceOptions,
    size = 'small',
    disabled = false,
    extraPadding,
  } = rest

  const b3Lang = useB3Lang()

  const muiAttributeProps = muiSelectProps || {}

  const fieldsProps = {
    type: fieldType,
    name,
    key: name,
    defaultValue,
    rules: {
      required:
        required &&
        b3Lang('global.validate.required', {
          label,
        }),
      validate: validate && ((v: string) => validate(v, b3Lang)),
    },
    control,
  }

  const onHandleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange()
    setValue(name, e.target.value)
  }

  const onChangeProps = onChange
    ? {
        onChange: onHandleChange,
      }
    : {}

  return ['dropdown'].includes(fieldType) ? (
    <FormControl
      variant="filled"
      style={{
        width: '100%',
        color: muiSelectProps?.disabled
          ? 'rgba(0, 0, 0, 0.38)'
          : 'rgba(0, 0, 0, 0.6)',
      }}
      disabled={disabled}
    >
      {label && (
        <InputLabel
          sx={{
            color: muiSelectProps?.disabled
              ? 'rgba(0, 0, 0, 0.38)'
              : 'rgba(0, 0, 0, 0.6)',
          }}
          error={!!errors[name]}
          required={required}
        >
          {label}
        </InputLabel>
      )}
      <Controller
        {...fieldsProps}
        render={({ field }) => (
          <Select
            {...field}
            {...muiAttributeProps}
            {...onChangeProps}
            size={size}
            error={!!errors[name]}
            sx={{
              ...extraPadding,
            }}
          >
            {options?.length &&
              options.map((option: any) => (
                <MenuItem
                  key={option[replaceOptions?.label || 'label']}
                  value={option[replaceOptions?.value || 'value']}
                >
                  {option[replaceOptions?.label || 'label']}
                </MenuItem>
              ))}
          </Select>
        )}
      />
      {errors[name] && (
        <FormHelperText error={!!errors[name]}>
          {errors[name] ? errors[name].message : null}
        </FormHelperText>
      )}
    </FormControl>
  ) : null
}
