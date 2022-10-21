import {
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
  Checkbox,
} from '@mui/material'
import {
  Controller,
} from 'react-hook-form'

import {
  useB3Lang,
} from '@b3/lang'
import Form from './ui'

interface CheckboxListProps {
  value: string,
  label: string,
  [key: string]: string,
}

export const B3ControlCheckbox = ({
  control,
  errors,
  getValues,
  ...rest
} : Form.B3UIProps) => {
  const {
    default: defaultValue,
    fieldType,
    name,
    required,
    label,
    validate,
    options,
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
              label && (
              <FormLabel
                error={!!errors[name]}
                required={required}
              >
                {label}
              </FormLabel>
              )
            }
            <Controller
              {...fieldsProps}
              render={({
                field: {
                  onChange,
                },
              }) => options?.map((list: CheckboxListProps) => (
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
