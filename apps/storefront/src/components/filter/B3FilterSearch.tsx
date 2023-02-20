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
  searchBGColor?: string
  placeholder?: string
  h?: number | string
}

const B3FilterSearch = ({
  handleChange,
  w = '100%',
  h,
  searchBGColor = '#efeae7',
  placeholder = 'Search',
}: B3FilterSearchProps) => {
  const [search, setSearch] = useState<string>('')
  const debouncedValue = useDebounce<string>(search, 500)

  const [isInitLoading, setIsInitLoading] = useState<boolean>(true)

  const handleSearchClick = () => {
    setIsInitLoading(false)
    handleChange(search)
  }

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    setIsInitLoading(true)
    setSearch(e.target.value)
  }

  // 防抖
  useEffect(() => {
    if (isInitLoading) return
    handleChange(search)
  }, [debouncedValue, isInitLoading])

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
        placeholder={placeholder}
        onChange={handleOnChange}
        onBlur={() => {
          setIsInitLoading(false)
        }}
      />
    </Paper>
  )
}

export default B3FilterSearch
