import {
  useState,
  ReactElement,
} from 'react'
import {
  Box,
} from '@mui/material'

import {
  useMobile,
} from '@/hooks'

import {
  B3Select,
} from '../ui'

import B3FilterSearch from './B3FilterSearch'

import B3FilterMore from './B3FilterMore'

// import B3FilterToggleTable from './B3FilterToggleTable'

interface sortByItemNameProps {
  valueName: string,
  labelName: string,
}

interface PickerProps {
  isEnabled: boolean;
  defaultValue?: Date | number | string
  label: string
  w?: number
  pickerKey?: string,
}

interface sortByConfigProps {
  isEnabled: boolean;
  sortByList: any[]
  sortByItemName?: sortByItemNameProps | undefined
  sortByLabel: string
  defaultValue?: string | undefined
  isFirstSelect?: boolean
  firstSelectText?: string
  w?: number
}

type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer U>
    ? ReadonlyArray<DeepPartial<U>>
    : DeepPartial<T[P]>;
}

interface B3FilterProps<T> {
  sortByConfig: sortByConfigProps
  startPicker: PickerProps
  endPicker: PickerProps
  fiterMoreInfo: Array<DeepPartial<T>>
  handleChange: (key: string, value: string) => void
  handleFilterChange: (value: {[key: string]: string | number | Date}) => void
}

const B3Filter:<T> (props: B3FilterProps<T>) => ReactElement = (props) => {
  const {
    sortByConfig,
    startPicker,
    endPicker,
    fiterMoreInfo,
    handleChange,
    handleFilterChange,
  } = props

  const {
    isEnabled: sortEnabled = false,
    sortByList = [],
    sortByItemName,
    sortByLabel = '',
    defaultValue: sortByDefaultValue = '',
    isFirstSelect,
    firstSelectText,
    w: sortByWidth = 150,
  } = sortByConfig

  const [isMobile] = useMobile()

  const [sortByValue, setSortBy] = useState<string>(sortByDefaultValue)

  const handleSortByChange = (value: string) => {
    setSortBy(value)
    handleChange('sortBy', value)
  }

  const handleSearchChange = (value:string) => {
    handleChange('search', value)
  }

  const handleFilterMoreChange = (filterItems: {[key: string]: string | number | Date}) => {
    handleFilterChange(filterItems)
  }

  return (
    <>
      {
        !isMobile && (
        <Box sx={{
          display: 'flex',
          justifyContent: 'space-between',
          mb: '30px',
        }}
        >
          <Box
            sx={{
              maxWidth: '24rem',
              flexBasis: '100%',
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <B3FilterSearch
              handleChange={handleSearchChange}
              w="70%"
            />
            <B3FilterMore
              startPicker={startPicker}
              endPicker={endPicker}
              fiterMoreInfo={fiterMoreInfo}
              onChange={handleFilterMoreChange}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
            }}
          >
            {
            sortEnabled && (
              <Box
                sx={{
                  m: '0 5px',
                }}
              >
                <B3Select
                  list={sortByList}
                  value={sortByValue}
                  handleChange={handleSortByChange}
                  label={sortByLabel}
                  config={sortByItemName}
                  isFirstSelect={isFirstSelect}
                  firstSelectText={firstSelectText}
                  w={sortByWidth}
                />
              </Box>
            )
          }
            {/* <B3FilterToggleTable /> */}
          </Box>

        </Box>
        )
      }
      {
        isMobile && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            mb: '5vw',
          }}
        >
          <Box
            sx={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              backgroundColor: '#fef9f5',
            }}
          >
            <B3FilterSearch
              handleChange={handleSearchChange}
              w="90%"
            />
            <B3FilterMore
              startPicker={startPicker}
              endPicker={endPicker}
              fiterMoreInfo={fiterMoreInfo}
              onChange={handleFilterMoreChange}
            />
          </Box>

        </Box>
        )
      }
    </>

  )
}

export default B3Filter
