import { Button, ButtonProps, SxProps } from '@mui/material';
import { forwardRef, MouseEvent } from 'react';

interface CustomButtonProps extends ButtonProps {
  onClick?: (e?: MouseEvent<HTMLButtonElement> | any) => void;
  sx?: SxProps;
  customLabel?: string;
  children: React.ReactNode;
}

const CustomButton = forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ onClick, sx, children, ...rest }, ref) => (
    <Button
      ref={ref}
      {...rest}
      onClick={onClick}
      sx={{
        ...(sx || {}),
      }}
    >
      {children}
    </Button>
  ),
);

export default CustomButton;
