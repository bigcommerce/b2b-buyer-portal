import { InputAdornment } from '@mui/material';

import { getCorrespondingCurrency } from '@/utils/currencyUtils';

// InputProps adornment slots that place the currency symbol per the currency's token_location
// (case-insensitive). Spread into a TextField's InputProps.
export const currencyAdornmentProps = (code?: string) => {
  const currency = getCorrespondingCurrency(code);
  const token = currency?.token || '$';
  const isTokenOnRight = currency?.token_location?.toLowerCase() === 'right';

  const adornment = (
    <InputAdornment
      position={isTokenOnRight ? 'end' : 'start'}
      sx={{ padding: '8px 0', marginTop: '0 !important' }}
    >
      {token}
    </InputAdornment>
  );

  return {
    startAdornment: isTokenOnRight ? undefined : adornment,
    endAdornment: isTokenOnRight ? adornment : undefined,
  };
};
