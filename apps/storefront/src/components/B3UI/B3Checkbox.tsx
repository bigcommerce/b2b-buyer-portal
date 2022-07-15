import {
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
  Checkbox,
} from '@mui/material'
import { Controller } from 'react-hook-form'

import B3UI from './ui'

interface CheckboxListProps {
  value: string,
  label: string,
  [key: string]: string,
}

export const B3Checkbox = ({
  control, errors, getValues, ...rest
} : B3UI.B3UIProps) => {
  const {
    fieldType, name, default: defaultValue, required, label, validate, options,
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

  const handleCheck = (value: Number | string, name: string) => {
    const getAllValue = getValues()[name] || []
    const valueString: string = `${value}`

    const newValue = getAllValue?.includes(valueString)
      ? getAllValue?.filter((id: string) => id !== value)
      : [...(getAllValue ?? []), value]

    return newValue
  }

  return (
    <>
      {
        ['checkbox'].includes(fieldType) && (
          <FormControl>
            {
              label && <FormLabel error={!!errors[name]} required={required}>{label}</FormLabel>
            }
            <Controller
              {...fieldsProps}
              render={({ field: { onChange } }) => options?.map((list: CheckboxListProps) => (
                <FormControlLabel
                  control={(
                    <Checkbox
                      onChange={() => onChange(handleCheck(list.value, name))}
                      defaultChecked={defaultValue.includes(list.value)}
                    />
                  )}
                  key={list.value}
                  label={list.label}
                />
              ))}
            />
            {
              errors[name] && (<FormHelperText error={!!errors[name]}>{(errors as any)[name] ? (errors as any)[name].message : null}</FormHelperText>)
            }
          </FormControl>
        )
      }
    </>
  )
}
