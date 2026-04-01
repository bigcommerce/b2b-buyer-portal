import { Typography } from '@mui/material';

interface ShippingExpectationPromptProps {
  backorderEnabled: boolean;
  hasBackorderedItems: boolean;
  showDefaultShippingExpectationPrompt: boolean;
  defaultShippingExpectationPrompt: string;
}

export default function ShippingExpectationPrompt({
  backorderEnabled,
  hasBackorderedItems,
  showDefaultShippingExpectationPrompt,
  defaultShippingExpectationPrompt,
}: ShippingExpectationPromptProps) {
  if (
    !backorderEnabled ||
    !hasBackorderedItems ||
    !showDefaultShippingExpectationPrompt ||
    !defaultShippingExpectationPrompt
  ) {
    return null;
  }

  return (
    <Typography
      sx={{
        fontSize: '0.85rem',
        color: '#616161',
        marginTop: 1,
      }}
    >
      {defaultShippingExpectationPrompt}
    </Typography>
  );
}
