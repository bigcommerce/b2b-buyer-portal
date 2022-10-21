import {
  ReactElement,
} from 'react'

import {
  LocalizationProvider,
} from '@mui/x-date-pickers/LocalizationProvider'
import {
  DesktopDatePicker,
} from '@mui/x-date-pickers/DesktopDatePicker'
import {
  AdapterDateFns,
} from '@mui/x-date-pickers/AdapterDateFns'

import {
  TextField,
} from '@mui/material'

interface B3PickerProps {
  onChange: (date: Date | null) => void;
  variant?: 'filled' | 'outlined' | 'standard';
  value: string;
  label: string;
}

export const B3Picker = ({
  onChange,
  variant,
  value,
  label,
}: B3PickerProps) => (
  <LocalizationProvider dateAdapter={AdapterDateFns}>
    <DesktopDatePicker
      label={label}
      onChange={onChange}
      value={value}
      renderInput={(params) => (
        <TextField
          {...params}
          variant={variant}
          inputProps={{
            readOnly: true,
          }}
          value={value}
        />
      )}
    />
  </LocalizationProvider>
)
