import { FormControl, FormHelperText, FormLabel, Radio, RadioGroup, useTheme } from '@mui/material';
import { Controller } from 'react-hook-form';

import { useB3Lang } from '@/lib/lang';

import { StyleRectangleFormControlLabel } from './styled';
import Form from './ui';

export default function B3ControlRectangle({ control, errors, ...rest }: Form.B3UIProps) {
  const {
    fieldType,
    name,
    default: defaultValue,
    required,
    label,
    validate,
    options,
    labelStyle = {},
  } = rest;

  const b3Lang = useB3Lang();
  const theme = useTheme();

  const primaryColor = theme.palette.primary.main;

  const fieldsProps = {
    type: fieldType,
    name,
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
  };

  return ['rectangle'].includes(fieldType) ? (
    <FormControl>
      {label && (
        <FormLabel error={!!errors[name]} required={required}>
          {label}
        </FormLabel>
      )}
      <Controller
        key={fieldsProps.name}
        {...fieldsProps}
        render={({ field }) => (
          <RadioGroup
            sx={{
              flexWrap: 'wrap',
              flexDirection: 'row',
              marginRight: '-12px',
            }}
            {...field}
          >
            {options?.length &&
              options.map((option: Form.RadopGroupListProps) => {
                const isActive = field.value.toString() === option.value.toString();

                return (
                  <StyleRectangleFormControlLabel
                    control={<Radio />}
                    key={option.value}
                    label={option.label}
                    sx={{
                      border: isActive ? `1px solid ${primaryColor}` : '1px solid #767676',
                      boxShadow: isActive ? `0 0 0 1px ${primaryColor}` : 'none',
                      ...labelStyle,
                    }}
                    value={option.value}
                  />
                );
              })}
          </RadioGroup>
        )}
      />
      {errors[name] && (
        <FormHelperText error={!!errors[name]}>
          {(errors as any)[name] ? (errors as any)[name].message : null}
        </FormHelperText>
      )}
    </FormControl>
  ) : null;
}
