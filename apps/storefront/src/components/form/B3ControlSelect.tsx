import { FormControl, FormHelperText, InputLabel, MenuItem, Select } from '@mui/material';
import { ChangeEvent, useId } from 'react';
import { Controller } from 'react-hook-form';

import { useB3Lang } from '@/lib/lang';

import Form from './ui';

export default function B3ControlSelect({ control, errors, ...rest }: Form.B3UIProps) {
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
  } = rest;
  const id = useId();
  const b3Lang = useB3Lang();

  const muiAttributeProps = muiSelectProps || {};

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

  const onHandleChange = (e: ChangeEvent<HTMLInputElement>) => {
    onChange();
    setValue(name, e.target.value);
  };

  const onChangeProps = onChange
    ? {
        onChange: onHandleChange,
      }
    : {};

  return ['dropdown'].includes(fieldType) ? (
    <FormControl
      disabled={disabled}
      style={{
        width: '100%',
        color: muiSelectProps?.disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.6)',
      }}
      variant="filled"
    >
      {label && (
        <InputLabel
          error={!!errors[name]}
          id={`${id}-label`}
          required={required}
          sx={{
            color: muiSelectProps?.disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.6)',
          }}
        >
          {label}
        </InputLabel>
      )}
      <Controller
        key={fieldsProps.name}
        {...fieldsProps}
        render={({ field }) => (
          <Select
            {...field}
            {...muiAttributeProps}
            {...onChangeProps}
            error={!!errors[name]}
            id={`${id}-select`}
            labelId={`${id}-label`}
            size={size}
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
  ) : null;
}
