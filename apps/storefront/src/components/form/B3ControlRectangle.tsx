import {
  Radio,
  FormControl,
  FormLabel,
  FormHelperText,
  RadioGroup,
  useTheme,
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
  StyleRectangleFormControlLabel,
} from './styled'

import {
  CustomStyleContext,
} from '@/shared/customStyleButtton'

export const B3ControlRectangle = ({
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
    labelStyle = {},
  } = rest

  const {
    state: {
      portalStyle: {
        primaryColor: customColor = '',
      },
    },
  } = useContext(CustomStyleContext)

  const b3Lang = useB3Lang()
  const theme = useTheme()

  const primaryColor = theme.palette.primary.main

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
        ['rectangle'].includes(fieldType) && (
          <FormControl
            sx={{
              '& .MuiFormLabel-root.Mui-focused': {
                color: customColor,
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
                  sx={{
                    flexWrap: 'wrap',
                    flexDirection: 'row',
                    marginRight: '-12px',
                  }}
                  {...field}
                >
                  {
                    options?.length && (
                      options.map((option: Form.RadopGroupListProps) => {
                        const isActive = field.value.toString() === option.value.toString()
                        return (
                          <StyleRectangleFormControlLabel
                            value={option.value}
                            label={option.label}
                            key={option.value}
                            sx={{
                              border: isActive ? `1px solid ${customColor || primaryColor}` : '1px solid #767676',
                              boxShadow: isActive ? `0 0 0 1px ${customColor || primaryColor}` : 'none',
                              ...labelStyle,
                              '& .MuiRadio-root.Mui-checked': {
                                color: customColor || primaryColor,
                              },
                            }}
                            control={(
                              <Radio />
                            )}
                          />
                        )
                      })
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
