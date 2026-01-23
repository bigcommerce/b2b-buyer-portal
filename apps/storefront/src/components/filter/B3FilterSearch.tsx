import { ChangeEvent, useEffect, useState } from 'react';
import { Clear as ClearIcon, Search as SearchIcon } from '@mui/icons-material';
import { InputBase, Paper } from '@mui/material';

import { useDebounce } from '@/hooks/useDebounce';
import { useB3Lang } from '@/lib/lang';

interface B3FilterSearchProps {
  handleChange: (value: string) => void;
  w?: number | undefined | string;
  searchBGColor?: string;
  placeholder?: string;
  h?: number | string;
  searchValue?: string;
}

function B3FilterSearch({
  handleChange,
  w = '100%',
  h,
  searchBGColor = '#efeae7',
  searchValue = '',
  ...restProps
}: B3FilterSearchProps) {
  const [search, setSearch] = useState<string>('');
  const b3Lang = useB3Lang();
  const debouncedValue = useDebounce<string>(search, 500);
  const { placeholder = b3Lang('global.filter.search') } = restProps;

  const handleOnChange = (e: ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
  };

  const handleClearSearchValue = () => {
    setSearch('');
  };

  // debounce
  useEffect(() => {
    handleChange(search);
    // disabling this rule as we need to wait for debounceValue change, to search
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedValue]);
  useEffect(() => {
    if (searchValue.length > 0) {
      setSearch(searchValue);
    }
  }, [searchValue]);

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
        endAdornment={
          search.length > 0 && (
            <ClearIcon
              onClick={handleClearSearchValue}
              sx={{
                marginRight: '8px',
                cursor: 'pointer',
                padding: '4px',
                fontSize: '1.8rem',
                color: 'rgba(0, 0, 0, 0.54)',
                ':hover': {
                  backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  borderRadius: '48px',
                },
              }}
            />
          )
        }
        onChange={handleOnChange}
        placeholder={placeholder}
        size="small"
        sx={{
          ml: 1,
          flex: 1,
          '& .MuiInputBase-input': {
            pb: 0,
          },
        }}
        value={search}
      />
    </Paper>
  );
}

export default B3FilterSearch;
