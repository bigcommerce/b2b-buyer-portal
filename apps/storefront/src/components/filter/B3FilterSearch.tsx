import {
  ChangeEvent,
  useEffect,
  useState,
} from 'react'

import {
  InputBase,
  IconButton,
  Paper,
} from '@mui/material'

import SearchIcon from '@mui/icons-material/Search'

import {
  useDebounce,
} from '@/hooks'

interface B3FilterSearchProps {
  handleChange: (value: string) => void
  w?: number | undefined |string
}

const B3FilterSearch = ({
  handleChange,
  w = '100%',
}: B3FilterSearchProps) => {
  const [search, setSearch] = useState<string>('')
  const debouncedValue = useDebounce<string>(search, 500)

  const handleSearchClick = () => {
    handleChange(search)
  }

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value)
  }

  // 防抖
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
          ml: 1,
          flex: 1,
          '& .MuiInputBase-input': {
            pb: 0,
          },
        }}
        size="small"
        value={search}
        placeholder="Search"
        onChange={handleOnChange}
      />
    </Paper>
  )
}

export default B3FilterSearch
