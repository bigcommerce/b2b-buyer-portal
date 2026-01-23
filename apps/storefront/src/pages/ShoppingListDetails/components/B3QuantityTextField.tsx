import { useCallback, useEffect, useState } from 'react';
import { TextField } from '@mui/material';
import { styled } from '@mui/material/styles';

import { useMobile } from '@/hooks/useMobile';

const StyledNumberNoTopTextField = styled(TextField)(() => ({
  '& input': {
    paddingRight: '6px',
  },
}));

interface B3NumberTextFieldProps {
  value: number;
  maxQuantity?: number;
  minQuantity?: number;
  isStock?: string;
  stock?: number;
  onChange: (value: number | string, isValid: boolean) => void;
}

export function B3QuantityTextField({
  value = 0,
  maxQuantity = 0,
  minQuantity = 0,
  isStock = '0',
  stock = 0,
  onChange = () => {},
}: B3NumberTextFieldProps) {
  const [isMobile] = useMobile();

  const sx = {
    width: isMobile ? '110px' : '72px',
    '& .MuiFormHelperText-root': {
      marginLeft: '0',
      marginRight: '0',
    },
  };

  const [validMessage, setValidMessage] = useState('');

  const validateQuantity = useCallback(
    (quantity: number) => {
      let validMessage = '';

      if (isStock === '1' && stock === 0) {
        validMessage = 'Out of stock';
      } else if (isStock === '1' && quantity > stock) {
        validMessage = `${stock} in stock`;
      } else if (minQuantity !== 0 && quantity < minQuantity) {
        validMessage = `Min is ${minQuantity}`;
      } else if (maxQuantity !== 0 && quantity > maxQuantity) {
        validMessage = `Max is ${maxQuantity}`;
      }

      setValidMessage(validMessage);

      return validMessage;
    },
    [isStock, maxQuantity, minQuantity, stock],
  );

  const handleChange = (value: string) => {
    onChange(value, Boolean(validMessage));
  };

  const handleBlur = () => {
    const quantity = parseInt(`${value}`, 10) || 0;

    onChange(quantity, !validateQuantity(quantity));
  };

  useEffect(() => {
    validateQuantity(value);
  }, [validateQuantity, value]);

  return (
    <StyledNumberNoTopTextField
      error={Boolean(validMessage)}
      helperText={validMessage}
      hiddenLabel={!isMobile}
      inputProps={{
        inputMode: 'numeric',
        min: 1,
        pattern: '[0-9]*',
      }}
      label={isMobile ? 'Qty' : ''}
      onBlur={() => {
        handleBlur();
      }}
      onChange={(e) => {
        handleChange(e.target.value);
      }}
      size="small"
      sx={sx}
      type="number"
      value={value}
      variant="filled"
    />
  );
}
