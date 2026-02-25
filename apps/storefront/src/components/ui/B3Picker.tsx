import { useRef, useState } from 'react';
import { Box, TextField } from '@mui/material';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { format as dateFnsFormat } from 'date-fns';

import { getDateLang } from '@/utils/b3DateFormat/setDateLocale';

interface B3PickerProps {
  onChange: (date: Date | string | number) => void;
  variant?: 'filled' | 'outlined' | 'standard';
  value: Date | string | number | undefined;
  label: string;
  disableOpenPicker?: boolean;
  formatInput?: string;
  size?: 'small' | 'medium' | undefined;
}

export function B3Picker({
  onChange,
  variant,
  value,
  label,
  disableOpenPicker = true,
  formatInput = 'yyyy-MM-dd',
  size = 'small',
}: B3PickerProps) {
  const pickerRef = useRef<HTMLInputElement | null>(null);
  const container = useRef<HTMLInputElement | null>(null);

  const activeLang = getDateLang();

  const [open, setOpen] = useState(false);
  const openPickerClick = () => {
    setOpen(!open);
    if (pickerRef?.current?.blur) {
      pickerRef.current.blur();
    }
  };

  const onHandleChange = (value: Date | number | string) => {
    if (typeof value !== 'string') {
      const pickerValue = dateFnsFormat(new Date(value), formatInput);
      onChange(pickerValue);
    } else {
      onChange(value);
    }
  };
  return (
    <>
      <Box ref={container} />
      <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale={activeLang}>
        <DatePicker
          label={label}
          DialogProps={{
            container: container.current,
          }}
          onChange={(val) => val && onHandleChange(val)}
          onClose={() => {
            setOpen(false);
          }}
          value={value || null}
          open={open}
          inputRef={pickerRef}
          disableOpenPicker={disableOpenPicker}
          renderInput={(params) => (
            <TextField
              {...params}
              size={size}
              onMouseDown={() => {
                openPickerClick();
              }}
              variant={variant}
            />
          )}
        />
      </LocalizationProvider>
    </>
  );
}
