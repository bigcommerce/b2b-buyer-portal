import { Control, Controller, FieldErrors } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import { Checkbox, FormControl, FormControlLabel, FormHelperText, FormLabel } from '@mui/material';

type B3Lang = ReturnType<typeof useB3Lang>;

export interface CheckboxFieldProps {
  control?: Control;
  name: string;
  required?: boolean;
  label: string;
  default?: string;
  validate?: (value: string, b3Lang: B3Lang) => string | undefined;
  errors: FieldErrors;
  getValues: () => Record<string, string[]>;
  options: { value: string; label: string }[];
}

export default function B3ControlCheckbox({
  control,
  errors,
  getValues,
  ...rest
}: CheckboxFieldProps) {
  const { default: defaultValue, name, required, label, validate, options } = rest;

  const b3Lang = useB3Lang();

  const fieldsProps = {
    type: 'checkbox',
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

  const handleCheck = (value: number | string, name: string) => {
    const getAllValue = getValues()[name] || [];
    const valueString = `${value}`;

    const newValue = getAllValue?.find((id) => `${id}` === valueString)
      ? getAllValue?.filter((id) => id !== value)
      : [...(getAllValue ?? []), value];

    return newValue;
  };

  const fieldError = errors[name];

  return (
    <FormControl>
      {label && (
        <FormLabel error={!!fieldError} required={required}>
          {label}
        </FormLabel>
      )}
      <Controller
        key={fieldsProps.name}
        {...fieldsProps}
        render={({ field: { onChange, value } }) => (
          <>
            {options.map((list) => (
              <FormControlLabel
                control={
                  <Checkbox
                    onChange={() => onChange(handleCheck(list.value, name))}
                    checked={value.includes(list.value)}
                  />
                }
                key={list.value}
                label={list.label}
              />
            ))}
          </>
        )}
      />
      {fieldError && (
        <FormHelperText error={!!fieldError}>
          {fieldError ? fieldError.message?.toString() : null}
        </FormHelperText>
      )}
    </FormControl>
  );
}
