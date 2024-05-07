import { SyntheticEvent, useCallback, useEffect, useState } from 'react';
import { Controller } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import { Autocomplete, FormControl, FormHelperText, TextField } from '@mui/material';
import debounce from 'lodash-es/debounce';

import { getB2BRoleList } from '@/shared/service/b2b';
import { useAppSelector } from '@/store';

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

  const values = getValues();

  const b3Lang = useB3Lang();

  const [options, setOptions] = useState<Option[]>([]);

  const [loading, setLoading] = useState<boolean>(false);

  const [inputValue, setInputValue] = useState<string>('');

  const [selectValue, setSelectValue] = useState<string>('');

  const [page, setPage] = useState<number>(1);
  const [hasMore, setHasMore] = useState<boolean>(true);

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

  const companyInfoId = useAppSelector(({ company }) => company.companyInfo.id);
  const salesRepCompanyId = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id);
  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const companyId = isAgenting ? +salesRepCompanyId : +companyInfoId;

  const fetchData = async ({ type = '', value = '' }) => {
    setLoading(true);

    try {
      const curPage = type === 'search' ? 1 : page;

      if (!hasMore && type === 'scroll') return;

      const {
        companyRoles: { edges },
      } = await getB2BRoleList({
        companyId,
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
      setSelectValue(defaultValue);
      fetchData({
        value: defaultName,
      });
    } else {
      fetchData({});
    }
    // disabling because we don't want to run this effect on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [defaultName]);

  const handleSelectChange = (event: SyntheticEvent, value: Option) => {
    setSelectValue(value.id);
    setInputValue(value.name);
    setValue(name, value.id);

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
    (event: SyntheticEvent, value: string, reason: string) => {
      if (reason === 'input') {
        const val = value === 'undefined' ? '' : value;
        setInputValue(val);
        handleFilterRoleChange(val);
      }
    },
    [handleFilterRoleChange],
  );

  const handleScroll = (event: SyntheticEvent) => {
    const listboxNode = event.currentTarget;
    const { scrollTop, clientHeight, scrollHeight } = listboxNode;
    if (scrollTop + clientHeight >= scrollHeight) {
      fetchData({
        type: 'scroll',
        value: inputValue,
      });
    }
  };

  useEffect(() => {
    if (!values[name]) {
      setInputValue('');
      setSelectValue('');
    }
    // disabling because we don't want to run this effect on every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [values]);

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
            autoSelect
            disableClearable
            options={options || []}
            isOptionEqualToValue={(option: Option, selectedValue: string) =>
              option.id === selectedValue
            }
            inputValue={inputValue}
            value={selectValue || ''}
            loadingText="Loading..."
            getOptionLabel={(option: Option) => option.name ?? option}
            openOnFocus
            onChange={handleSelectChange}
            onInputChange={handleInputChange}
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
