import { MoreHoriz as MoreHorizIcon } from '@mui/icons-material';
import { IconButton, Menu, MenuItem } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useRef, useState } from 'react';

const StyledMenu = styled(Menu)(() => ({
  '& .MuiPaper-elevation': {
    boxShadow:
      '0px 1px 0px -1px rgba(0, 0, 0, 0.1), 0px 1px 6px rgba(0, 0, 0, 0.07), 0px 1px 4px rgba(0, 0, 0, 0.06)',
    borderRadius: '4px',
  },
}));

interface Props {
  label: string;
  onClick: () => void;
}

export function ActionMenuCell({ label, onClick }: Props) {
  const ref = useRef<HTMLButtonElement | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <IconButton onClick={() => setIsOpen(true)} ref={ref}>
        <MoreHorizIcon />
      </IconButton>
      <StyledMenu
        anchorEl={ref.current}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        onClose={() => setIsOpen(false)}
        open={isOpen}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem
          onClick={() => {
            onClick();
            setIsOpen(false);
          }}
          sx={{
            color: 'primary.main',
          }}
        >
          {label}
        </MenuItem>
      </StyledMenu>
    </>
  );
}
