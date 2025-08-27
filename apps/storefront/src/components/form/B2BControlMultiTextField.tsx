import { KeyboardEvent } from 'react';
import { Controller } from 'react-hook-form';
import { Add, Clear } from '@mui/icons-material';
import { Box, TextField, Typography } from '@mui/material';
import { concat, debounce, uniq } from 'lodash-es';
import isEmpty from 'lodash-es/isEmpty';

import { useB3Lang } from '@/lib/lang';

import Form from './ui';

export default function B2BControlMultiTextField({ control, errors, ...rest }: Form.B3UIProps) {
  const {
    fieldType,
    isAutoComplete = false,
    name,
    default: defaultValue,
    required,
    label,
    validate,
    variant,
    rows,
    min,
    max,
    minLength,
    maxLength,
    fullWidth = true,
    disabled,
    labelName,
    size,
    readOnly,
    sx = {},
    isTip = false,
    tipText = '',
    extraPadding,
    isEnterTrigger,
    handleSave,
    getValues,
    InputProps = {},
    existValue,
    setError,
    setValue,
  } = rest;
  const b3Lang = useB3Lang();

  const requiredText = b3Lang('global.validate.required', {
    label: labelName || label,
  });

  const fieldsProps = {
    type: fieldType,
    name,
    defaultValue,
    rules: {
      required: required && requiredText,
      validate: validate && ((v: string) => validate(v, b3Lang)),
    },
    control,
  };

  const textField = {
    type: fieldType,
    name,
    label,
    rows,
    disabled,
    variant,
    fullWidth,
    required,
    size,
  };

  const otherProps = {
    inputProps: {
      min,
      max,
      maxLength,
      minLength,
      readOnly,
    },
  };

  const handleAddNewItem = () => {
    const currentValue = getValues(name).trim();
    const isValidValue = validate(currentValue, b3Lang);
    if (isValidValue) {
      setError(name, {
        type: 'custom',
        message: isValidValue,
      });
    } else {
      const newItems = uniq(concat(existValue, currentValue.length ? [currentValue] : []));

      setValue(name, '');
      if (handleSave) handleSave(newItems);
    }
  };

  const handleDelete = (currentItem: string) => {
    const newItems = existValue.filter((item: string) => item !== currentItem);
    if (handleSave) handleSave(newItems);
  };

  const handleKeyDown = debounce((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      handleAddNewItem();
    } else {
      event.preventDefault();
    }
  }, 300);

  const autoCompleteFn = () => {
    if (!isAutoComplete) {
      return {
        autoComplete: 'off',
      };
    }
    return {};
  };

  return ['multiInputText'].includes(fieldType) ? (
    <Box>
      {labelName && (
        <Box
          sx={{
            mb: 1,
          }}
        >
          {`${labelName} :`}
        </Box>
      )}
      <Controller
        key={fieldsProps.name}
        {...fieldsProps}
        render={({ field: { ...rest } }) => (
          <TextField
            key={textField.name}
            {...textField}
            {...rest}
            {...otherProps}
            sx={{
              color: disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.6)',
              ...sx,
              '& input': {
                ...extraPadding,
              },
            }}
            error={!!errors[name]}
            helperText={(errors as any)[name] ? (errors as any)[name].message : null}
            onKeyDown={isEnterTrigger ? handleKeyDown : () => {}}
            InputProps={
              !isEmpty(InputProps)
                ? { ...InputProps }
                : {
                    endAdornment: (
                      <Add
                        onClick={handleAddNewItem}
                        sx={{
                          cursor: 'pointer',
                        }}
                      />
                    ),
                  }
            }
            {...autoCompleteFn()}
          />
        )}
      />
      {existValue.length ? (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'row',
            flexWrap: 'wrap',

            '& div': {
              marginRight: '10px',
            },
          }}
        >
          {existValue.map((item: string) => (
            <Typography
              key={item}
              sx={{
                display: 'flex',
                alignItems: 'center',
                border: '1px solid #E0E0E0',
                borderRadius: '4px',
                padding: '4px',
                marginRight: '10px',
                marginTop: '10px',
                wordBreak: 'break-all',

                '& svg': {
                  marginLeft: '10px',
                  cursor: 'pointer',
                },
              }}
            >
              {item}
              <Clear
                onClick={() => {
                  handleDelete(item);
                }}
              />
            </Typography>
          ))}
        </Box>
      ) : null}
      {isTip && (
        <Box
          sx={{
            fontSize: '12px',
            color: 'rgba(0, 0, 0, 0.6)',
            marginTop: '0.5rem',
          }}
        >
          {tipText}
        </Box>
      )}
    </Box>
  ) : null;
}
