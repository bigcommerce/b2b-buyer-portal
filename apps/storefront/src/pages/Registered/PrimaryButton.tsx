import { Button, useTheme } from '@mui/material';

interface Props {
  onClick: React.MouseEventHandler<HTMLButtonElement>;
  children: React.ReactNode;
}

export function PrimaryButton({ onClick, children }: Props) {
  const theme = useTheme();

  return (
    <Button
      onClick={onClick}
      sx={{
        backgroundColor: theme.palette.primary.main,
      }}
      type="button"
      variant="contained"
    >
      {children}
    </Button>
  );
}
