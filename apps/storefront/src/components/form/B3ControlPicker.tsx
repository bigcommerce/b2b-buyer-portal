import { useContext, useRef, useState } from 'react';
import { Control, Controller, FieldErrors, FieldValues, Path, PathValue } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import { Box, TextField } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker, DatePickerProps } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

import { GlobalContext } from '@/shared/global';

import setDayjsLocale from '../ui/setDayjsLocale';

import { PickerFormControl } from './styled';

type B3Lang = ReturnType<typeof useB3Lang>;

export interface PickerFieldProps<T extends FieldValues> {
  control?: Control<T>;
  name: Path<T>;
  default: PathValue<T, Path<T>>;
  required: boolean;
  label: string;
  validate: (value: string, b3Lang: B3Lang) => string | undefined;
  muiTextFieldProps?: DatePickerProps<Date, Date>;
  setValue: (name: string, value: string | Date | null) => void;
  variant: 'filled' | 'outlined' | 'standard';
  getValues: (name: string) => Date;
  errors: FieldErrors<T>;
}

export default function B3ControlPicker<T extends FieldValues>({
  control,
  errors,
  ...rest
}: PickerFieldProps<T>) {
  const {
    name,
    default: defaultValue,
    required,
    label,
    validate,
    muiTextFieldProps,
    setValue,
    variant,
    getValues,
  } = rest;

  const {
    state: { bcLanguage },
  } = useContext(GlobalContext);

  const [open, setOpen] = useState(false);

  const container = useRef<HTMLInputElement | null>(null);

  const pickerRef = useRef<HTMLInputElement | null>(null);

  const b3Lang = useB3Lang();
  const activeLang = setDayjsLocale(bcLanguage || 'en');

  const inputFormat = muiTextFieldProps?.inputFormat || 'YYYY-MM-DD';

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

  const muiPickerProps = muiTextFieldProps || {};

  const handleDatePickerChange = (value: Date | null) => {
    try {
      setValue(name, dayjs(value).format(inputFormat));
    } catch (error) {
      setValue(name, value);
    }
  };

  const fieldError = errors[name];

  return (
    <>
      <Box ref={container} />
      <PickerFormControl>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={activeLang}>
          <Controller
            key={fieldsProps.name}
            {...fieldsProps}
            render={({ field: { ref, ...rest } }) => (
              <DatePicker
                label={label}
                inputFormat={inputFormat}
                {...muiPickerProps}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    variant={variant || 'filled'}
                    required={required}
                    inputProps={{
                      readOnly: true,
                    }}
                    onMouseDown={() => {
                      setOpen(true);
                      if (pickerRef?.current?.blur) {
                        pickerRef.current.blur();
                      }
                    }}
                    value={getValues(name) || defaultValue}
                    error={!!fieldError}
                    helperText={fieldError ? fieldError.message?.toString() : null}
                  />
                )}
                {...rest}
                DialogProps={{
                  container: container.current,
                }}
                open={open}
                onClose={() => {
                  setOpen(false);
                }}
                onChange={handleDatePickerChange}
              />
            )}
          />
        </LocalizationProvider>
      </PickerFormControl>
    </>
  );
}
