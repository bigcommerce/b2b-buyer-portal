import { MouseEvent, Ref } from 'react';
import { Button, ButtonProps, SxProps } from '@mui/material';

interface CustomButtonProps extends ButtonProps {
  onClick?: (e?: MouseEvent<HTMLButtonElement> | any) => void;
  sx?: SxProps;
  customLabel?: string;
  children: React.ReactNode;
  ref?: Ref<HTMLButtonElement>;
}

function CustomButton({ onClick, sx, children, ref, ...rest }: CustomButtonProps) {
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
}

export default CustomButton;
