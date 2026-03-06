import { useCallback, useEffect, useState } from 'react';
import { TextField } from '@mui/material';
import { styled } from '@mui/material/styles';

import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';

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
  const b3Lang = useB3Lang();
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
        validMessage = b3Lang('shoppingList.quantityTextField.outOfStock');
      } else if (isStock === '1' && quantity > stock) {
        validMessage = b3Lang('shoppingList.quantityTextField.available', { stock });
      } else if (minQuantity !== 0 && quantity < minQuantity) {
        validMessage = b3Lang('shoppingList.quantityTextField.minQuantity', { minQuantity });
      } else if (maxQuantity !== 0 && quantity > maxQuantity) {
        validMessage = b3Lang('shoppingList.quantityTextField.maxQuantity', { maxQuantity });
      }

      setValidMessage(validMessage);

      return validMessage;
    },
    [b3Lang, isStock, maxQuantity, minQuantity, stock],
  );

  const handleChange = (value: string) => {
    onChange(value, !!validMessage);
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
      size="small"
      type="number"
      variant="filled"
      hiddenLabel={!isMobile}
      label={isMobile ? b3Lang('shoppingList.table.quantity') : ''}
      value={value}
      error={!!validMessage}
      helperText={validMessage}
      inputProps={{
        inputMode: 'numeric',
        min: 1,
        pattern: '[0-9]*',
      }}
      onChange={(e) => {
        handleChange(e.target.value);
      }}
      onBlur={() => {
        handleBlur();
      }}
      sx={sx}
    />
  );
}
