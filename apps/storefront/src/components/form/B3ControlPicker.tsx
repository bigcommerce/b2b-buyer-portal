import { Controller } from 'react-hook-form';
import { Box, TextField } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { useContext, useRef, useState } from 'react';

import { useB3Lang } from '@/lib/lang';
import { GlobalContext } from '@/shared/global';

import setDayjsLocale from '../ui/setDayjsLocale';

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

  const {
    state: { bcLanguage },
  } = useContext(GlobalContext);

  const [open, setOpen] = useState(false);

  const container = useRef<HTMLInputElement | null>(null);

  const pickerRef = useRef<HTMLInputElement | null>(null);

  const b3Lang = useB3Lang();
  const activeLang = setDayjsLocale(bcLanguage || 'en');

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
        <LocalizationProvider adapterLocale={activeLang} dateAdapter={AdapterDayjs}>
          <Controller
            key={fieldsProps.name}
            {...fieldsProps}
            render={({ field: { ref, ...rest } }) => (
              <DatePicker
                inputFormat={inputFormat}
                label={label}
                {...muixPickerProps}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    error={Boolean(errors[name])}
                    helperText={errors[name] ? errors[name].message : null}
                    inputProps={{
                      readOnly: true,
                    }}
                    onMouseDown={() => {
                      setOpen(true);

                      if (pickerRef.current?.blur) {
                        pickerRef.current.blur();
                      }
                    }}
                    required={required}
                    value={getValues(name) || defaultValue}
                    variant={variant || 'filled'}
                  />
                )}
                {...rest}
                DialogProps={{
                  container: container.current,
                }}
                onChange={handleDatePickerChange}
                onClose={() => {
                  setOpen(false);
                }}
                open={open}
              />
            )}
          />
        </LocalizationProvider>
      </PickerFormControl>
    </>
  ) : null;
}
