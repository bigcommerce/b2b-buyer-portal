import { ChangeEvent, useEffect, useState } from 'react'
import SearchIcon from '@mui/icons-material/Search'
import { InputBase, Paper } from '@mui/material'

import { useDebounce } from '@/hooks'

interface B3FilterSearchProps {
  handleChange: (value: string) => void
  w?: number | undefined | string
  searchBGColor?: string
  placeholder?: string
  h?: number | string
}

function B3FilterSearch({
  handleChange,
  w = '100%',
  h,
  searchBGColor = '#efeae7',
  placeholder = 'Search',
}: B3FilterSearchProps) {
  const [search, setSearch] = useState<string>('')
  const debouncedValue = useDebounce<string>(search, 500)

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  // debounce
  useEffect(() => {
    handleChange(search)
  }, [debouncedValue])

  return (
    <Paper
      component="div"
      sx={{
        p: '2px 4px',
        display: 'flex',
        alignItems: 'center',
        width: w,
        maxWidth: w,
        border: 'none',
        boxShadow: 'none',
        height: h || '50px',
        borderBottomLeftRadius: '0',
        borderBottomRightRadius: '0',
        borderBottom: '1px solid rgba(0, 0, 0, 0.42)',
        backgroundColor: searchBGColor,
      }}
    >
      <SearchIcon
        sx={{
          p: '10px',
          color: 'rgba(0, 0, 0, 0.54)',
          fontSize: '2.7rem',
        }}
      />
      <InputBase
        sx={{
          ml: 1,
          flex: 1,
          '& .MuiInputBase-input': {
            pb: 0,
          },
        }}
        size="small"
        value={search}
        placeholder={placeholder}
        onChange={handleOnChange}
      />
    </Paper>
  )
}

export default B3FilterSearch
