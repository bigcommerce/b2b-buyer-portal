import {
  BaseSyntheticEvent,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useForm } from 'react-hook-form'
import FilterListIcon from '@mui/icons-material/FilterList'
import { Box, IconButton, useTheme } from '@mui/material'

import { B3CustomForm, B3Dialog, CustomButton } from '@/components'
import { useMobile } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'

import {
  getContrastColor,
  getHoverColor,
} from '../outSideComponents/utils/b3CustomStyles'

import B3FilterPicker from './B3FilterPicker'

interface PickerProps {
  isEnabled: boolean
  defaultValue?: Date | number | string | null
  label: string
  pickerKey?: string
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>
}

interface B3FilterMoreProps<T, Y> {
  startPicker?: PickerProps
  endPicker?: PickerProps
  fiterMoreInfo: Array<DeepPartial<T>>
  onChange?: (val: Y) => void
  isShowMore?: boolean
}

interface PickerRefProps extends HTMLInputElement {
  setClearPickerValue: () => void
  getPickerValue: () => { [key: string]: string }
}

function B3FilterMore<T, Y>({
  startPicker,
  endPicker,
  fiterMoreInfo,
  onChange,
  isShowMore = false,
}: B3FilterMoreProps<T, Y>) {
  const {
    state: {
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)

  const customColor = getContrastColor(backgroundColor)

  const [open, setOpen] = useState<boolean>(false)
  const [isFiltering, setIsFiltering] = useState<boolean>(false)
  const [filterCounter, setFilterCounter] = useState<number>(0)

  const [cacheData, setCacheData] = useState<CustomFieldItems | null>(null)

  const pickerRef = useRef<PickerRefProps | null>(null)

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
  } = useForm({
    mode: 'onSubmit',
  })

  const [isMobile] = useMobile()

  const theme = useTheme()
  const primaryColor = theme.palette.primary.main

  useEffect(() => {
    if (cacheData) {
      Object.keys(cacheData).forEach((item: string) => {
        setValue(item, cacheData[item])
      })
    }
  }, [open])

  const handleDialogClick = () => {
    setOpen(true)
  }

  const handleClose = () => {
    setOpen(false)
  }

  const handleFilterStatus = (submitData?: any) => {
    if (submitData) {
      const filterCountArr = []
      const isNotFiltering = Object.keys(submitData).every(
        (item) => submitData[item] === ''
      )
      Object.keys(submitData).forEach((item) => {
        if (submitData[item] !== '') {
          filterCountArr.push(item)
        }
      })

      setIsFiltering(!isNotFiltering)
      setFilterCounter(filterCountArr.length)
    }
  }

  const handleSaveFilters = (
    event: BaseSyntheticEvent<object, any, any> | undefined
  ) => {
    handleSubmit((data) => {
      const getPickerValues = pickerRef.current?.getPickerValue()
      if (onChange) {
        const submitData: any = {
          ...getPickerValues,
          ...data,
        }

        handleFilterStatus(submitData)
        onChange(submitData)

        setCacheData({
          ...data,
        })
      }
      handleClose()
    })(event)
  }

  const handleClearFilters = () => {
    Object.keys(getValues()).forEach((item: string) => {
      setValue(item, '')
    })
    pickerRef.current?.setClearPickerValue()
  }

  return (
    <Box
      sx={{
        ml: 3,
        cursor: 'pointer',
      }}
    >
      {((fiterMoreInfo && fiterMoreInfo.length) || isShowMore) && (
        <Box
          onClick={handleDialogClick}
          sx={{
            mr: '-10px',
          }}
        >
          {!isFiltering && (
            <IconButton
              aria-label="edit"
              size="medium"
              sx={{
                color: customColor,
                ':hover': {
                  backgroundColor: getHoverColor('#FFFFFF', 0.1),
                },
              }}
            >
              <FilterListIcon />
            </IconButton>
          )}
          {isFiltering && (
            <>
              <IconButton
                aria-label="edit"
                size="medium"
                sx={{
                  color: customColor,
                  ':hover': {
                    backgroundColor: getHoverColor('#FFFFFF', 0.1),
                  },
                }}
              >
                <FilterListIcon />
              </IconButton>
              <Box
                sx={{
                  display: 'flex',
                  flexFlow: 'row wrap',
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: primaryColor || '#ff8a65',
                  fontSize: '12px',
                  ml: '5px',
                  justifyContent: 'center',
                  alignContent: 'center',
                  alignItems: 'center',
                  position: 'absolute',
                  top: '7px',
                  padding: '0 7px',
                  transform: 'scale(1) translate(50%, -50%)',
                  transformOrigin: '100% 0%',
                }}
              >
                {filterCounter}
              </Box>
            </>
          )}
        </Box>
      )}

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
        <CustomButton
          sx={{
            mt: 1,
          }}
          onClick={handleClearFilters}
          size="small"
        >
          clear filters
        </CustomButton>
      </B3Dialog>
    </Box>
  )
}

export default B3FilterMore
