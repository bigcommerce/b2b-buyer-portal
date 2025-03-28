import { Control, Controller, FieldErrors, FieldValues, Path, PathValue } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import {
  FormControl,
  FormHelperText,
  FormLabel,
  Radio,
  RadioGroup,
  SxProps,
  useTheme,
} from '@mui/material';

import { StyleRectangleFormControlLabel } from './styled';

type B3Lang = ReturnType<typeof useB3Lang>;

export interface RectangleProps<T extends FieldValues> {
  control?: Control<T>;
  name: Path<T>;
  default?: PathValue<T, Path<T>>;
  required?: boolean;
  label: string;
  validate?: (value: string, b3Lang: B3Lang) => string | undefined;
  labelStyle?: SxProps;
  options?: { value: string | number; label: JSX.Element | string }[];
  errors: FieldErrors<T>;
}

export default function B3ControlRectangle<T extends FieldValues>({
  control,
  errors,
  ...rest
}: RectangleProps<T>) {
  const { name, default: defaultValue, required, label, validate, options, labelStyle = {} } = rest;

  const b3Lang = useB3Lang();
  const theme = useTheme();

  const primaryColor = theme.palette.primary.main;

  const fieldsProps = {
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
          <RadioGroup
            sx={{
              flexWrap: 'wrap',
              flexDirection: 'row',
              marginRight: '-12px',
            }}
            {...field}
          >
            {options?.length &&
              options.map((option) => {
                const isActive = field.value.toString() === option.value.toString();
                return (
                  <StyleRectangleFormControlLabel
                    value={option.value}
                    label={option.label}
                    key={option.value}
                    sx={{
                      border: isActive ? `1px solid ${primaryColor}` : '1px solid #767676',
                      boxShadow: isActive ? `0 0 0 1px ${primaryColor}` : 'none',
                      ...labelStyle,
                    }}
                    control={<Radio />}
                  />
                );
              })}
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
