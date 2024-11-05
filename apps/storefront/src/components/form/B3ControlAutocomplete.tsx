import { SyntheticEvent, useCallback, useEffect, useRef, useState } from 'react';
import { Controller, useWatch } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import { Autocomplete, FormControl, FormHelperText, TextField } from '@mui/material';
import debounce from 'lodash-es/debounce';

import { getB2BRoleList } from '@/shared/service/b2b';

import Form from './ui';

interface Option {
  id: string;
  name: string;
}

const first = 10;

export default function B3ControlAutocomplete({ control, errors, ...rest }: Form.B3UIProps) {
  const {
    name,
    default: defaultValue,
    defaultName,
    required,
    label,
    validate,
    muiSelectProps,
    setValue,
    getValues,
    setValueName,
    size = 'small',
    disabled = false,
    extraPadding,
  } = rest;

  const b3Lang = useB3Lang();

  const [options, setOptions] = useState<Option[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  const [inputValue, setInputValue] = useState<string>('');

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);
  const [isSearchKeyEmpty, setIsSearchKeyEmpty] = useState<boolean>(true);

  const cache = useRef({
    selectValue: '',
    inputValue: '',
    preSelectValue: '',
  });

  const inputNameKey = `${name}Name`;
  const nameKey = useWatch({
    control,
    name: inputNameKey,
  });
  useEffect(() => {
    if (nameKey) {
      setInputValue(getValues()[nameKey as string]);
    } else {
      setInputValue('');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [nameKey]);

  const muiAttributeProps = muiSelectProps || {};

  const fieldsProps = {
    name,
    key: name,
    rules: {
      required:
        required &&
        b3Lang('global.validate.required', {
          label,
        }),
      validate: validate && ((v: string) => validate(v, b3Lang)),
    },
    control,
  };

  const fetchData = async ({ type = '', value = '' }) => {
    if (loading) return;
    setLoading(true);

    try {
      const curPage = type === 'search' ? 1 : page;

      if (!hasMore && type === 'scroll') return;

      const {
        companyRoles: { edges },
      } = await getB2BRoleList({
        offset: (curPage - 1) * first,
        first,
        search: value,
      });

      const list = edges.map((item: any) => ({
        id: item.node.id,
        name: item.node.name,
      }));

      setOptions((prevOptions) => (type === 'search' ? [...list] : [...prevOptions, ...list]));
      setHasMore(list.length > 0);
      setPage(curPage + 1);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!!defaultValue && !!defaultName) {
      setInputValue(defaultName || '');
      cache.current.selectValue = defaultValue;
      cache.current.preSelectValue = defaultValue;
      cache.current.inputValue = defaultName;
    }
    // disabling because we don't want to run this effect on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultName]);

  const handleSelectChange = (_: SyntheticEvent, value: Option) => {
    setInputValue(value.name);

    cache.current.selectValue = value.id;

    cache.current.inputValue = value.name;

    setValue(name, value.id);
    setValue(`${name}Name`, value.name);

    if (setValueName) {
      setValueName(value.name);
    }
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const handleFilterRoleChange = useCallback(
    debounce((value: string) => {
      fetchData({
        value,
        type: 'search',
      });
    }, 500),
    [options, page],
  );

  const handleInputChange = useCallback(
    (_: SyntheticEvent, value: string, reason: string) => {
      if (reason === 'input') {
        const val = value === 'undefined' ? '' : value;
        setInputValue(val);
        setIsSearchKeyEmpty(false);
        handleFilterRoleChange(val);
      }
    },
    [handleFilterRoleChange],
  );

  const handleOpenSelect = (event: SyntheticEvent) => {
    if (event.type === 'click' || event.type === 'mousedown') fetchData({});
  };

  const handleScroll = (event: SyntheticEvent) => {
    const listboxNode = event.currentTarget;
    const { scrollTop, clientHeight, scrollHeight } = listboxNode;
    if (scrollTop + clientHeight + 1 >= scrollHeight) {
      fetchData({
        type: 'scroll',
        value: isSearchKeyEmpty ? '' : inputValue,
      });
    }
  };

  const handleClose = () => {
    setPage(1);
    setOptions([]);
    setIsSearchKeyEmpty(true);
    const { preSelectValue, selectValue, inputValue } = cache.current;
    if (preSelectValue === selectValue) {
      setInputValue(inputValue || '');
    } else {
      cache.current.preSelectValue = cache.current.selectValue;
    }
  };

  return (
    <FormControl
      variant="filled"
      style={{
        width: '100%',
        color: muiSelectProps?.disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.6)',
      }}
      disabled={disabled}
    >
      <Controller
        {...fieldsProps}
        render={({ field }) => (
          <Autocomplete
            {...field}
            {...muiAttributeProps}
            loading={loading}
            disableClearable
            options={options || []}
            inputValue={inputValue}
            value={inputValue || ''}
            loadingText="Loading..."
            getOptionLabel={(option: Option) => option.name ?? option}
            openOnFocus
            onChange={handleSelectChange}
            onInputChange={handleInputChange}
            onOpen={handleOpenSelect}
            onClose={handleClose}
            size={size}
            sx={{
              ...extraPadding,
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                variant="filled"
                error={!!errors[name]}
                required={required}
                label={label}
              />
            )}
            ListboxProps={{
              onScroll: handleScroll,
              style: {
                maxHeight: '35vh',
                overflow: 'auto',
              },
            }}
          />
        )}
      />
      {errors[name] && (
        <FormHelperText error={!!errors[name]}>
          {errors[name] ? errors[name].message : null}
        </FormHelperText>
      )}
    </FormControl>
  );
}
