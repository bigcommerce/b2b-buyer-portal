import { forwardRef, MouseEvent } from 'react';
import { Button, ButtonProps, SxProps } from '@mui/material';

interface CustomButtonProps extends ButtonProps {
  onClick?: (e?: MouseEvent<HTMLButtonElement> | any) => void;
  sx?: SxProps;
  customLabel?: string;
  children: React.ReactNode;
}

const CustomButton = forwardRef<HTMLButtonElement, CustomButtonProps>(
  ({ onClick, sx, children, ...rest }, ref) => {
    return (
      <Button
        ref={ref}
        {...rest}
        sx={{
          ...(sx || {}),
        }}
        onClick={onClick}
      >
        {children}
      </Button>
    );
  },
);

export default CustomButton;
