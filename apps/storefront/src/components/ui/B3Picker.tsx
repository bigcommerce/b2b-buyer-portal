import { useRef, useState } from 'react'
import { TextField } from '@mui/material'
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns'
import { DesktopDatePicker } from '@mui/x-date-pickers/DesktopDatePicker'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'
import format from 'date-fns/format'

interface B3PickerProps {
  onChange: (date: Date | string | number) => void
  variant?: 'filled' | 'outlined' | 'standard'
  value: Date | string | number | undefined
  label: string
  disableOpenPicker?: boolean
  formatInput?: string
  size?: 'small' | 'medium' | undefined
}

export default function B3Picker({
  onChange,
  variant,
  value,
  label,
  disableOpenPicker = true,
  formatInput = 'yyyy-MM-dd',
  size = 'small',
}: B3PickerProps) {
  const pickerRef = useRef(null)

  const [open, setOpen] = useState(false)
  const openPickerClick = () => {
    setOpen(!open)
    if (pickerRef && pickerRef?.current && (pickerRef.current as any)?.blur) {
      ;(pickerRef.current as any).blur()
    }
  }

  const onHandleChange = (value: Date | number | string) => {
    if (typeof value !== 'string') {
      const pickerValue = format(value, formatInput)
      onChange(pickerValue)
    } else {
      onChange(value)
    }
  }
  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <DesktopDatePicker
        label={label}
        onChange={(val) => val && onHandleChange(val)}
        onClose={() => {
          setOpen(false)
        }}
        value={value || null}
        open={open}
        inputRef={pickerRef}
        disableOpenPicker={disableOpenPicker}
        renderInput={(params) => (
          <TextField
            {...params}
            size={size}
            onClick={() => openPickerClick()}
            variant={variant}
          />
        )}
      />
    </LocalizationProvider>
  )
}
