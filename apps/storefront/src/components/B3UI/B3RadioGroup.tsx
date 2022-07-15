import {
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  FormHelperText,
} from '@mui/material'
import { Controller } from 'react-hook-form'

import B3UI from './ui'

export const B3RadioGroup = ({ control, errors, ...rest } : B3UI.B3UIProps) => {
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

  return (
    <>
      {
        ['radio'].includes(fieldType) && (
          <FormControl>
            {
              label && <FormLabel error={!!errors[name]} required={required}>{label}</FormLabel>
            }
            <Controller
              {...fieldsProps}
              render={({ field }) => (
                <RadioGroup
                  {...field}
                >
                  {
                    options?.length && (
                      options.map((option: B3UI.RadopGroupListProps) => (
                        <FormControlLabel
                          value={option.value}
                          label={option.label}
                          key={option.label}
                          control={(
                            <Radio />
                          )}
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
