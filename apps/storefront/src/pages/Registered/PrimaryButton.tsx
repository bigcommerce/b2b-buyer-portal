import { Button, useTheme } from '@mui/material';

interface Props {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
}

export function PrimaryButton({ onClick, children }: Props) {
  const theme = useTheme();

  return (
    <Button
      variant="contained"
      type="button"
      onClick={onClick}
      sx={{
        backgroundColor: theme.palette.primary.main,
      }}
    >
      {children}
    </Button>
  );
}
