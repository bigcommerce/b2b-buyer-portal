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

import {
  useContext,
} from 'react'

import Form from './ui'

import {
  CustomStyleContext,
} from '@/shared/customStyleButtton'

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

  const {
    state: {
      portalStyle: {
        primaryColor = '',
      },
    },
  } = useContext(CustomStyleContext)

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

    const newValue = getAllValue?.find((id: Number | string) => `${id}` === valueString)
      ? getAllValue?.filter((id: string) => id !== value)
      : [...(getAllValue ?? []), value]

    return newValue
  }

  return (
    <>
      {
        ['checkbox'].includes(fieldType) && (
          <FormControl
            sx={{
              '& .MuiFormLabel-root.Mui-focused': {
                color: primaryColor,
              },
            }}
          >
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
                  value,
                },
              }) => options?.map((list: CheckboxListProps) => (
                <FormControlLabel
                  control={(
                    <Checkbox
                      onChange={() => onChange(handleCheck(list.value, name))}
                      checked={(value as any).includes(list.value)}
                    />
                    )}
                  key={list.value}
                  label={list.label}
                  sx={{
                    '& .MuiCheckbox-root.Mui-checked': {
                      color: primaryColor,
                    },
                  }}
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
