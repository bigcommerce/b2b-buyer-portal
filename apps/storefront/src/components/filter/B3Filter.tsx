import {
  useState,
} from 'react'
import {
  Box,
  InputBase,
  IconButton,
  Paper,
} from '@mui/material'

import {
  format,
} from 'date-fns'

import SearchIcon from '@mui/icons-material/Search'

import {
  B3Picker,
} from '../form/B3Picker'

const inputFormat = 'yyyy-MM-dd'

const B3Filter = () => {
  const [startValue, setStartValue] = useState<string>(format(new Date(), inputFormat))
  const [endValue, setEndValue] = useState<string>(format(new Date(), inputFormat))

  const handleSearchClick = () => {
    console.log('111')
  }

  const handleOnChange = (e) => {
    console.log(e.target.value, '22')
  }

  const handleStartDatePickerChange = (value: Date | null) => {
    if (value) setStartValue(format(value, inputFormat))
  }

  const handleEndDatePickerChange = (value: Date | null) => {
    if (value) setEndValue(format(value, inputFormat))
  }

  return (
    <Box sx={{
      display: 'flex',
    }}
    >
      <Paper
        component="div"
        sx={{
          p: '2px 4px',
          display: 'flex',
          alignItems: 'center',
          width: 250,
          border: 'none',
          boxShadow: 'none',
          borderBottomLeftRadius: '0',
          borderBottomRightRadius: '0',
          borderBottom: '1px solid rgba(0, 0, 0, 0.42)',
          backgroundColor: '#efeae7',
        }}
      >
        <IconButton
          onClick={handleSearchClick}
          sx={{
            p: '10px',
          }}
          aria-label="search"
        >
          <SearchIcon />
        </IconButton>
        <InputBase
          sx={{
            ml: 1, flex: 1,
          }}
          placeholder="Search"
          onChange={handleOnChange}
          inputProps={{
            'aria-label': 'search',
          }}
        />
      </Paper>
      <Box
        sx={{
          width: '150px',
        }}
      >
        <B3Picker
          onChange={handleStartDatePickerChange}
          value={startValue}
          label="From"
          variant="filled"
        />
      </Box>

      <Box
        sx={{
          width: '150px',
        }}
      >
        <B3Picker
          onChange={handleEndDatePickerChange}
          value={endValue}
          label="To"
          variant="filled"
        />
      </Box>

    </Box>
  )
}

export default B3Filter
