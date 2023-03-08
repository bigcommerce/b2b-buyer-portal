import FilterListIcon from '@mui/icons-material/FilterList'
import {
  Box,
} from '@mui/material'

import Button from '@mui/material/Button'

import {
  // DeepPartial,
  useForm,
} from 'react-hook-form'

import {
  useState,
  useRef,
  BaseSyntheticEvent,
  ReactElement,
} from 'react'

import {
  useMobile,
} from '@/hooks'

import {
  B3CustomForm,
  B3Dialog,
} from '@/components'

import B3FilterPicker from './B3FilterPicker'

interface PickerProps {
  isEnabled: boolean;
  defaultValue?: Date | number | string | null
  label: string
  pickerKey?: string,
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>;
}

interface B3FilterMoreProps<T, Y> {
  startPicker?: PickerProps
  endPicker?: PickerProps
  fiterMoreInfo: Array<DeepPartial<T>>
  onChange?: (val: Y) => void
  handleChange?:() => void
  isShowMore?: boolean
}

interface PickerRefProps extends HTMLInputElement {
  setClearPickerValue: () => void
  getPickerValue: () => {[key: string]: string}
}

const B3FilterMore:<T, Y> ({
  startPicker,
  endPicker,
  fiterMoreInfo,
  onChange,
  handleChange,
  isShowMore,
}: B3FilterMoreProps<T, Y>) => ReactElement = ({
  startPicker,
  endPicker,
  fiterMoreInfo,
  onChange,
  handleChange,
  isShowMore = false,
}) => {
  const [open, setOpen] = useState<boolean>(false)

  const pickerRef = useRef<PickerRefProps | null>(null)

  const {
    control,
    handleSubmit,
    getValues,
    formState: {
      errors,
    },
    setValue,
  } = useForm({
    mode: 'onSubmit',
  })

  const [isMobile] = useMobile()

  const handleDialogClick = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleSaveFilters = (event: BaseSyntheticEvent<object, any, any> | undefined) => {
    handleSubmit((data) => {
      const getPickerValues = pickerRef.current?.getPickerValue()
      if (onChange) {
        const submitData: any = {
          ...getPickerValues, ...data,
        }
        onChange(submitData)
      }
      handleClose()
    })(event)
  }

  const handleClearFilters = () => {
    Object.keys(getValues()).forEach((item: string) => {
      setValue(item, '')
    })
    pickerRef.current?.setClearPickerValue()

    if (handleChange) {
      handleChange()
    }
  }

  return (
    <Box
      sx={{
        ml: 3,
        cursor: 'pointer',
      }}
    >

      {
        ((fiterMoreInfo && fiterMoreInfo.length) || isShowMore) && (
        <Box onClick={handleDialogClick}>
          <FilterListIcon />
        </Box>
        )
      }

      <B3Dialog
        isOpen={open}
        leftSizeBtn="Cancel"
        rightSizeBtn="Apply"
        title="Filters"
        handleLeftClick={handleClose}
        handRightClick={handleSaveFilters}
      >
        <Box
          sx={{
            width: `${isMobile ? '100%' : '450px'}`,
          }}
        >
          <B3CustomForm
            formFields={fiterMoreInfo}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
          <B3FilterPicker
            ref={pickerRef}
            startPicker={startPicker}
            endPicker={endPicker}
          />
        </Box>
        <Button
          sx={{
            mt: 1,
          }}
          onClick={handleClearFilters}
          size="small"
        >
          clear filters

        </Button>
      </B3Dialog>
    </Box>

  )
}

export default B3FilterMore
