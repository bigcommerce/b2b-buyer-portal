import {
  useState,
  forwardRef,
  useImperativeHandle,
  Ref,
} from 'react'

import {
  Box,
} from '@mui/material'

// import {
//   useMobile,
// } from '@/hooks'

import {
  distanceDay,
} from '@/utils'

import {
  B3Picker,
} from '../ui'

interface PickerProps {
  isEnabled: boolean;
  defaultValue?: Date | number | string
  label: string
  pickerKey?: string,
}

interface B3FilterPickerProps {
  startPicker: PickerProps
  endPicker: PickerProps
  handleChange?: (key: string, value: Date | string | number) => void
}

const B3FilterPickers = ({
  startPicker,
  endPicker,
  handleChange,
}: B3FilterPickerProps, ref: Ref<unknown> | undefined) => {
  const {
    isEnabled: startDateEnable = true,
    label: startLabel = 'From',
    defaultValue: startDateDefaultValue = new Date(),
    pickerKey: startPickerKey = 'start',
  } = startPicker

  const {
    isEnabled: endDateEnable = true,
    label: endLabel = 'To',
    defaultValue: endDateDefaultValue = new Date(),
    pickerKey: endPickerKey = 'end',
  } = endPicker

  // const [isMobile] = useMobile()

  const [startValue, setStartValue] = useState<Date | number | string>(startDateDefaultValue)
  const [endValue, setEndValue] = useState<Date | number | string>(endDateDefaultValue)

  const setClearPickerValue = () => {
    setStartValue(distanceDay(30))
    setEndValue(distanceDay())
  }

  const getPickerValue = () => ({
    startValue,
    endValue,
  })
  useImperativeHandle(ref, () => ({
    setClearPickerValue,
    getPickerValue,
  }))

  const handleStartDatePickerChange = (value: Date | string | number) => {
    setStartValue(value)
    if (handleChange) {
      handleChange(startPickerKey, value)
    }
  }

  const handleEndDatePickerChange = (value: Date | string | number) => {
    setEndValue(value)
    if (handleChange) {
      handleChange(endPickerKey, value)
    }
  }

  return (
    <Box
      sx={{
        display: 'flex',
      }}
    >
      {
      startDateEnable && (
      <Box
        sx={{
          width: '49%',
          mt: '16px',
          mr: '1%',
          cursor: 'pointer',
          '& > .MuiFormControl-root': {
            width: '100%',
          },
        }}
      >
        <B3Picker
          onChange={handleStartDatePickerChange}
          value={startValue}
          label={startLabel}
          variant="filled"
        />
      </Box>
      )
    }

      {
      endDateEnable && (
      <Box
        sx={{
          width: '49%',
          mt: '16px',
          ml: '1%',
          '& > .MuiFormControl-root': {
            width: '100%',
          },
          cursor: 'pointer',
        }}
      >
        <B3Picker
          onChange={handleEndDatePickerChange}
          value={endValue}
          label={endLabel}
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
