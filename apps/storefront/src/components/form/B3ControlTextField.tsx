import { ComponentProps, KeyboardEvent, WheelEvent } from 'react';
import { Control, Controller, FieldErrors, FieldValues, Path, PathValue } from 'react-hook-form';
import { useB3Lang } from '@b3/lang';
import {
  Box,
  SxProps,
  TextField,
  TextFieldProps as MUITextFieldProps,
  TextFieldVariants,
} from '@mui/material';
import debounce from 'lodash-es/debounce';

import { StyleNumberTextField } from './styled';

type B3Lang = ReturnType<typeof useB3Lang>;

export interface TextFieldProps<T extends FieldValues> {
  control?: Control<T>;
  fieldType: 'text' | 'number' | 'password' | 'multiline';
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
  muiTextFieldProps?: (
    | ComponentProps<typeof StyleNumberTextField>
    | ComponentProps<typeof StyleNumberTextField>
  )['inputProps'];
  disabled?: boolean;
  labelName?: string;
  size?: MUITextFieldProps['size'];
  allowArrow?: boolean;
  readOnly: boolean;
  sx?: SxProps;
  isTip?: boolean;
  tipText?: string;
  extraPadding: { paddingTop: string };
  fieldId?: string;
  isEnterTrigger?: boolean;
  errors: FieldErrors;
  handleEnterClick?: () => void;
}

export default function B3ControlTextField<T extends FieldValues>({
  control,
  errors,
  ...rest
}: TextFieldProps<T>) {
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
    fullWidth,
    muiTextFieldProps,
    disabled,
    labelName,
    size,
    readOnly,
    allowArrow = false,
    sx = {},
    isTip = false,
    tipText = '',
    extraPadding,
    fieldId,
    isEnterTrigger,
    handleEnterClick,
  } = rest;

  const b3Lang = useB3Lang();

  let requiredText = '';
  if (fieldType === 'password') {
    requiredText = b3Lang('global.validate.password.required');
  } else {
    requiredText = b3Lang('global.validate.required', {
      label: labelName || label,
    });
  }

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
    multiline: fieldType === 'multiline',
    variant,
    fullWidth: fullWidth || true,
    required,
    size,
  };

  const inputProps = {
    min,
    max,
    maxLength,
    minLength,
    readOnly,
  };

  const muiAttributeProps = muiTextFieldProps
    ? {
        ...muiTextFieldProps,
        ...inputProps,
      }
    : {
        ...inputProps,
      };

  const handleNumberInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    const keys = allowArrow ? ['KeyE', 'Period'] : ['ArrowUp', 'ArrowDown', 'KeyE', 'Period'];
    if (keys.indexOf(event.code) > -1) {
      event.preventDefault();
    }
  };

  const handleKeyDown = debounce((event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && handleEnterClick) {
      handleEnterClick();
    } else {
      event.preventDefault();
    }
  }, 300);

  const handleNumberInputWheel = (event: WheelEvent<HTMLInputElement>) => {
    (event.target as HTMLElement).blur();
  };
  const autoCompleteFn = () => {
    if (!isAutoComplete) {
      return {
        autoComplete: 'off',
      };
    }
    return {};
  };
  const newExtraPadding =
    fieldId === 'field_state' && extraPadding.paddingTop === '0px' ? {} : extraPadding;

  const fieldError = errors[name];

  return (
    <>
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
        render={({ field: { ...rest } }) =>
          fieldType === 'number' ? (
            <StyleNumberTextField
              key={textField.name}
              {...textField}
              {...rest}
              sx={{
                color: disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.6)',
                '& input': {
                  ...newExtraPadding,
                },
              }}
              allowArrow={allowArrow ? 1 : 0}
              inputProps={muiAttributeProps}
              error={!!fieldError}
              helperText={fieldError ? fieldError.message?.toString() : null}
              onKeyDown={handleNumberInputKeyDown}
              onWheel={handleNumberInputWheel}
            />
          ) : (
            <TextField
              key={textField.name}
              {...textField}
              {...rest}
              sx={{
                color: disabled ? 'rgba(0, 0, 0, 0.38)' : 'rgba(0, 0, 0, 0.6)',
                ...sx,
                '& input': {
                  ...newExtraPadding,
                },
                '& textarea': {
                  ...newExtraPadding,
                },
              }}
              inputProps={muiAttributeProps}
              error={!!fieldError}
              helperText={fieldError ? fieldError.message?.toString() : null}
              onKeyDown={isEnterTrigger ? handleKeyDown : () => {}}
              {...autoCompleteFn()}
            />
          )
        }
      />
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
    </>
  );
}
