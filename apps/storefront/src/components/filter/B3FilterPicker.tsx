import {
  useState,
  forwardRef,
  useImperativeHandle,
  Ref,
  useEffect,
} from 'react'

import {
  Box,
} from '@mui/material'

import {
  distanceDay,
} from '@/utils'

import {
  B3Picker,
} from '../ui'

interface PickerProps {
  isEnabled: boolean;
  defaultValue?: Date | number | string | null
  label: string
  pickerKey?: string,
}

interface B3FilterPickerProps {
  startPicker?: PickerProps
  endPicker?: PickerProps
  xs?: {[key: string]: number | string}
  isMonthlySpacing?: boolean,
  handleChange?: (key: string, value: Date | string | number) => void
}

const B3FilterPickers = ({
  startPicker,
  endPicker,
  handleChange,
  isMonthlySpacing = false,
  xs = {},
}: B3FilterPickerProps, ref: Ref<unknown> | undefined) => {
  // const [isMobile] = useMobile()
  const [startValue, setStartValue] = useState<Date | number | string>()
  const [endValue, setEndValue] = useState<Date | number | string>()

  const setClearPickerValue = () => {
    setStartValue(isMonthlySpacing ? distanceDay(30) : '')
    setEndValue(isMonthlySpacing ? distanceDay() : '')
  }

  useEffect(() => {
    setStartValue(startPicker?.defaultValue || '')
  }, [startPicker?.defaultValue])

  useEffect(() => {
    setEndValue(endPicker?.defaultValue || '')
  }, [endPicker?.defaultValue])

  const getPickerValue = () => {
    const data = {
      startValue,
      endValue,
    }
    return startPicker?.isEnabled ? data : {}
  }
  useImperativeHandle(ref, () => ({
    setClearPickerValue,
    getPickerValue,
  }))

  const handleStartDatePickerChange = (value: Date | string | number) => {
    setStartValue(value)
    if (handleChange) {
      handleChange(startPicker?.pickerKey || 'start', value)
    }
  }

  const handleEndDatePickerChange = (value: Date | string | number) => {
    setEndValue(value)
    if (handleChange) {
      handleChange(endPicker?.pickerKey || 'end', value)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
      }}
    >
      {
      startPicker?.isEnabled && (
      <Box
        sx={{
          width: '49%',
          mt: '16px',
          mr: '1%',
          cursor: 'pointer',
          '& > .MuiFormControl-root': {
            width: '100%',
          },
          ...xs,
        }}
      >
        <B3Picker
          onChange={handleStartDatePickerChange}
          value={startValue}
          label={startPicker?.label}
          variant="filled"
        />
      </Box>
      )
    }

      {
      endPicker?.isEnabled && (
      <Box
        sx={{
          width: '49%',
          mt: '16px',
          ml: '1%',
          '& > .MuiFormControl-root': {
            width: '100%',
          },
          cursor: 'pointer',
          ...xs,
        }}
      >
        <B3Picker
          onChange={handleEndDatePickerChange}
          value={endValue}
          label={endPicker?.label}
          variant="filled"
        />
      </Box>
      )
    }
    </Box>

  )
}

const B3FilterPicker = forwardRef(B3FilterPickers)

export default B3FilterPicker
