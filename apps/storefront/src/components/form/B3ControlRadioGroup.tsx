import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
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

export const B3ControlRadioGroup = ({
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

  return (
    <>
      {
        ['radio'].includes(fieldType) && (
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
                field,
              }) => (
                <RadioGroup
                  {...field}
                >
                  {
                    options?.length && (
                      options.map((option: Form.RadopGroupListProps) => (
                        <FormControlLabel
                          value={option.value}
                          label={option.label}
                          key={option.value}
                          control={(
                            <Radio />
                          )}
                          sx={{
                            '& .MuiRadio-root.Mui-checked': {
                              color: primaryColor,
                            },
                          }}
                        />
                      ))
                    )
                  }
                </RadioGroup>
              )}
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
