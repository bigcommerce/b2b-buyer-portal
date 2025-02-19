import { KeyboardEvent } from 'react';
import {
  Control,
  Controller,
  FieldError,
  FieldErrors,
  FieldValues,
  Path,
  PathValue,
} from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import { Add, Clear } from '@mui/icons-material';
import {
  Box,
  InputProps,
  SxProps,
  TextField,
  TextFieldProps,
  TextFieldVariants,
  Typography,
} from '@mui/material';
import { concat, debounce, uniq } from 'lodash-es';
import isEmpty from 'lodash-es/isEmpty';

type B3Lang = ReturnType<typeof useB3Lang>;

export interface MultiTextFieldProps<T extends FieldValues> {
  control?: Control<T>;
  name: Path<T>;
  isAutoComplete?: boolean;
  default: PathValue<T, Path<T>>;
  required: boolean;
  label: string;
  validate: (value: string, b3Lang: B3Lang) => string | undefined;
  variant: TextFieldVariants;
  rows?: number;
  min?: number;
  max?: number;
  minLength?: number;
  maxLength?: number;
  fullWidth?: boolean;
  disabled?: boolean;
  labelName?: string;
  size?: TextFieldProps['size'];
  readOnly: boolean;
  sx?: SxProps;
  isTip?: boolean;
  tipText?: string;
  extraPadding?: SxProps;
  isEnterTrigger?: boolean;
  getValues: (name: string) => string;
  handleSave?: (newItems: string[]) => void;
  InputProps?: InputProps;
  existValue: string[];
  setError: (name: string, error: FieldError) => void;
  setValue: (name: string, value: string) => void;
  errors: FieldErrors;
}

export default function B2BControlMultiTextField<T extends FieldValues>({
  control,
  errors,
  ...rest
}: MultiTextFieldProps<T>) {
  const {
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

  // this can probably be removed
  // neither Controller nor TextField allow for a type of 'multiInputText'
  // requires further investigation
  const type = 'multiInputText';

  const requiredText = b3Lang('global.validate.required', {
    label: labelName || label,
  });

  const fieldsProps = {
    type,
    name,
    defaultValue,
    rules: {
      required: required && requiredText,
      validate: validate && ((v: string) => validate(v, b3Lang)),
    },
    control,
  };

  const textField = {
    type,
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

  const fieldError = errors[name];

  return (
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
              // @ts-expect-error - caused by the illegal '& input' sibling
              color: disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.6)',
              ...sx,
              // @ts-expect-error - does not conform to TextFieldProps from MUI
              '& input': {
                ...extraPadding,
              },
            }}
            error={!!fieldError}
            helperText={fieldError ? fieldError.message?.toString() : null}
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
  );
}
