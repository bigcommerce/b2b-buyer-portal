import { Box, TextField } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { useContext, useRef, useState } from 'react';

import { GlobalContext } from '@/shared/global';

import setDayjsLocale from './setDayjsLocale';

interface B3PickerProps {
  onChange: (date: Date | string | number) => void;
  variant?: 'filled' | 'outlined' | 'standard';
  value: Date | string | number | undefined;
  label: string;
  disableOpenPicker?: boolean;
  formatInput?: string;
  size?: 'small' | 'medium' | undefined;
}

export default function B3Picker({
  onChange,
  variant,
  value,
  label,
  disableOpenPicker = true,
  formatInput = 'YYYY-MM-DD',
  size = 'small',
}: B3PickerProps) {
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const container = useRef<HTMLInputElement | null>(null);

  const {
    state: { bcLanguage },
  } = useContext(GlobalContext);

  const activeLang = setDayjsLocale(bcLanguage || 'en');

  const [open, setOpen] = useState(false);
  const openPickerClick = () => {
    setOpen(!open);

    if (pickerRef?.current?.blur) {
      pickerRef.current.blur();
    }
  };

  const onHandleChange = (value: Date | number | string) => {
    if (typeof value !== 'string') {
      const pickerValue = dayjs(value).format(formatInput);

      onChange(pickerValue);
    } else {
      onChange(value);
    }
  };

  return (
    <>
      <Box ref={container} />
      <LocalizationProvider adapterLocale={activeLang} dateAdapter={AdapterDayjs}>
        <DatePicker
          DialogProps={{
            container: container.current,
          }}
          disableOpenPicker={disableOpenPicker}
          inputRef={pickerRef}
          label={label}
          onChange={(val) => val && onHandleChange(val)}
          onClose={() => {
            setOpen(false);
          }}
          open={open}
          renderInput={(params) => (
            <TextField
              {...params}
              onMouseDown={() => {
                openPickerClick();
              }}
              size={size}
              variant={variant}
            />
          )}
          value={value || null}
        />
      </LocalizationProvider>
    </>
  );
}
