import { Control, Controller, FieldErrors } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import {
  FormControl,
  FormControlLabel,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
} from '@mui/material';

type B3Lang = ReturnType<typeof useB3Lang>;

export interface RadioGroupFieldProps {
  control?: Control;
  name: string;
  default: string;
  required: boolean;
  label: string;
  validate?: (value: string, b3Lang: B3Lang) => string | undefined;
  errors: FieldErrors;
  options: { value: string; label: string | JSX.Element; image?: { data: string; alt: string } }[];
}

export default function B3ControlRadioGroup({ control, errors, ...rest }: RadioGroupFieldProps) {
  const { name, default: defaultValue, required, label, validate, options } = rest;

  const b3Lang = useB3Lang();

  const fieldsProps = {
    type: 'radio',
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
        render={({ field }) => (
          <RadioGroup {...field}>
            {options?.length &&
              options.map((option) => (
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
      {fieldError && (
        <FormHelperText error={!!fieldError}>
          {fieldError ? fieldError.message?.toString() : null}
        </FormHelperText>
      )}
    </FormControl>
  );
}
