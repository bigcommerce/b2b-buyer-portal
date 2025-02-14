import { Control, Controller, FieldErrors } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import {
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  SelectChangeEvent,
  SelectProps,
} from '@mui/material';

type B3Lang = ReturnType<typeof useB3Lang>;

export interface SelectFieldProps {
  control?: Control;
  name: string;
  default: string;
  required: boolean;
  label: string;
  validate: (value: string, b3Lang: B3Lang) => string | undefined;
  options: { label: string; value: string }[];
  muiSelectProps?: SelectProps<string>;
  setValue: (name: string, value: string) => void;
  onChange?: () => void;
  size?: 'small' | 'medium';
  disabled?: boolean;
  extraPadding?: { paddingTop: string };
  errors: FieldErrors;
  replaceOptions?: { label: string; value: string };
}

export default function B3ControlSelect({ control, errors, ...rest }: SelectFieldProps) {
  const {
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

  const b3Lang = useB3Lang();

  const muiAttributeProps = muiSelectProps || {};

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

  const onHandleChange = (e: SelectChangeEvent<string>) => {
    onChange?.();
    setValue(name, e.target.value);
  };

  const onChangeProps = onChange
    ? {
        onChange: onHandleChange,
      }
    : {};

  const fieldError = errors[name];

  return (
    <FormControl
      variant="filled"
      style={{
        width: '100%',
        color: muiSelectProps?.disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.6)',
      }}
      disabled={disabled}
    >
      {label && (
        <InputLabel
          sx={{
            color: muiSelectProps?.disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.6)',
          }}
          error={!!fieldError}
          required={required}
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
            size={size}
            error={!!fieldError}
            sx={{
              ...extraPadding,
            }}
          >
            {options?.length &&
              options.map((option) => (
                <MenuItem
                  // @ts-expect-error impossible to type a possibly undefined value keying "option"
                  key={option[replaceOptions?.label || 'label']}
                  // @ts-expect-error impossible to type a possibly undefined value keying "option"
                  value={option[replaceOptions?.value || 'value']}
                >
                  {/* @ts-expect-error impossible to type a possibly undefined value keying "option" */}
                  {option[replaceOptions?.label || 'label']}{' '}
                </MenuItem>
              ))}
          </Select>
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
