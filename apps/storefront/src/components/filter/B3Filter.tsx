import {
  useState,
  ReactElement,
} from 'react'
import {
  Box,
  Button,
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
  sortByList?: any[]
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

interface customButtomProps {
  isEnabled: boolean;
  customLabel: string;
  customButtomStyle?: {[key: string]: string}
}

interface B3FilterProps<T, Y> {
  sortByConfig?: sortByConfigProps
  customButtomConfig?: customButtomProps
  startPicker?: PickerProps
  endPicker?: PickerProps
  fiterMoreInfo: Array<DeepPartial<T>>
  handleChange: (key: string, value: string) => void
  handleFilterChange: (value: Y) => void
  handleFilterCustomButtomClick?: () => void
}

const B3Filter:<T, Y> (props: B3FilterProps<T, Y>) => ReactElement = (props) => {
  const {
    sortByConfig,
    startPicker,
    endPicker,
    fiterMoreInfo,
    customButtomConfig,
    handleChange,
    handleFilterChange,
    handleFilterCustomButtomClick,
  } = props

  const [isMobile] = useMobile()

  const [sortByValue, setSortBy] = useState<string>(sortByConfig?.defaultValue || '')

  const handleSortByChange = (value: string) => {
    setSortBy(value)
    handleChange('sortBy', value)
  }

  const handleSearchChange = (value:string) => {
    handleChange('search', value)
  }

  // const handleFilterMoreChange = (filterItems) => {
  //   handleFilterChange(filterItems)
  // }

  const handleCustomBtnClick = () => {
    if (handleFilterCustomButtomClick) handleFilterCustomButtomClick()
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
              onChange={handleFilterChange}
            />
          </Box>

          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {
              sortByConfig?.isEnabled && (
                <Box
                  sx={{
                    m: '0 5px',
                  }}
                >
                  <B3Select
                    list={sortByConfig?.sortByList || []}
                    value={sortByValue}
                    handleChange={handleSortByChange}
                    label={sortByConfig?.sortByLabel || ''}
                    config={sortByConfig?.sortByItemName}
                    isFirstSelect={sortByConfig?.isFirstSelect}
                    firstSelectText={sortByConfig?.firstSelectText}
                    w={sortByConfig?.w || 150}
                  />
                </Box>
              )
            }
            {
              customButtomConfig?.isEnabled && (
                <Button
                  size="small"
                  variant="contained"
                  sx={{
                    height: '42px',
                    p: '0 20px',
                    ...customButtomConfig?.customButtomStyle || {},
                  }}
                  onClick={handleCustomBtnClick}
                >
                  {customButtomConfig?.customLabel || ''}
                </Button>
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
              onChange={handleFilterChange}
            />
          </Box>
          {
            customButtomConfig?.isEnabled && (
              <Button
                size="small"
                variant="contained"
                fullWidth
                sx={{
                  marginTop: '20px',
                  height: '42px',
                  ...customButtomConfig?.customButtomStyle || {},
                }}
                onClick={handleCustomBtnClick}
              >
                {customButtomConfig?.customLabel || ''}
              </Button>
            )
          }
        </Box>
        )
      }
    </>
  )
}

export default B3Filter
