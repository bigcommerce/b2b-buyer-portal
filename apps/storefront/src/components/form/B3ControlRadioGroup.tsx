import { Controller } from 'react-hook-form'
import { useB3Lang } from '@b3/lang'
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material'

import Form from './ui'

export default function B3ControlRadioGroup({
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
  } = rest

  const b3Lang = useB3Lang()

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

  return ['radio'].includes(fieldType) ? (
    <FormControl>
      {label && (
        <FormLabel error={!!errors[name]} required={required}>
          {label}
        </FormLabel>
      )}
      <Controller
        {...fieldsProps}
        render={({ field }) => (
          <RadioGroup {...field}>
            {options?.length &&
              options.map((option: Form.RadopGroupListProps) => (
                <FormControlLabel
                  value={option.value}
                  label={option.label}
                  key={option.value}
                  control={<Radio />}
                />
              ))}
          </RadioGroup>
        )}
      />
      {errors[name] && (
        <FormHelperText error={!!errors[name]}>
          {(errors as any)[name] ? (errors as any)[name].message : null}
        </FormHelperText>
      )}
    </FormControl>
  ) : null
}
