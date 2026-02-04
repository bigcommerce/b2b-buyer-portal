import { useRef, useState } from 'react';
import { Controller } from 'react-hook-form';
import { Box, TextField } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';

import { useB3Lang } from '@/lib/lang';
import { getDayjsLocale } from '@/utils/b3DateFormat/setDayjsLocale';

import { PickerFormControl } from './styled';
import Form from './ui';

export function B3ControlPicker({ control, errors, ...rest }: Form.B3UIProps) {
  const {
    fieldType,
    name,
    default: defaultValue,
    required,
    label,
    validate,
    muiTextFieldProps = {},
    setValue,
    variant,
    getValues,
  } = rest;

  const [open, setOpen] = useState(false);

  const container = useRef<HTMLInputElement | null>(null);

  const pickerRef = useRef<HTMLInputElement | null>(null);

  const b3Lang = useB3Lang();
  const activeLang = getDayjsLocale();

  const { inputFormat = 'YYYY-MM-DD' } = muiTextFieldProps;

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

  const muixPickerProps = muiTextFieldProps || {};

  const handleDatePickerChange = (value: Date) => {
    try {
      setValue(name, dayjs(value).format(inputFormat));
    } catch (error) {
      setValue(name, value);
    }
  };

  return ['date'].includes(fieldType) ? (
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
                {...muixPickerProps}
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
                    error={!!errors[name]}
                    helperText={(errors as any)[name] ? (errors as any)[name].message : null}
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
  ) : null;
}
