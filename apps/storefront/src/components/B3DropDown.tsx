import { useRef, useState } from 'react';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Box, MenuProps } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { useMobile } from '@/hooks';

export interface ListItemProps {
  name: string;
  key: string | number;
}

interface B3DropDownProps extends Partial<MenuProps> {
  width?: string;
  list: Array<ListItemProps>;
  title: string;
  handleItemClick?: (key: string | number) => void;
  value?: string;
  menuRenderItemName?: (item: ListItemProps) => JSX.Element | string;
}

export default function B3DropDown({
  width,
  list,
  title,
  value,
  handleItemClick,
  menuRenderItemName = (item) => item.name,
  ...menu
}: B3DropDownProps) {
  const [isMobile] = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  const close = () => {
    setIsOpen(false);
  };

  return (
    <Box
      sx={{
        width: width || 'auto',
      }}
    >
      <ListItemButton
        ref={ref}
        onClick={() => setIsOpen(true)}
        sx={{
          pr: 0,
        }}
      >
        <ListItemText
          primary={title}
          sx={{
            '& span': {
              fontWeight: isMobile ? 400 : 700,
              color: '#333333',
            },
          }}
        />
        {isOpen ? <ArrowDropUpIcon /> : <ArrowDropDownIcon />}
      </ListItemButton>
      <Menu
        anchorEl={ref.current}
        open={isOpen}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
        id="customized-menu"
        keepMounted
        onClose={close}
        sx={{
          '& .MuiList-root.MuiList-padding.MuiMenu-list': {
            pt: isMobile ? 0 : '8px',
            pb: isMobile ? 0 : '8px',
            maxHeight: isMobile ? 'auto' : '200px',
          },
        }}
        {...(menu || {})}
      >
        {list.length &&
          list.map((item) => {
            const { key } = item;
            const color = value === key ? '#3385d6' : 'black';
            return (
              <MenuItem
                sx={{
                  color,
                  minWidth: isMobile ? 'auto' : width || '155px',
                }}
                key={key}
                onClick={() => {
                  close();
                  if (handleItemClick) handleItemClick(key);
                }}
              >
                {menuRenderItemName(item)}
              </MenuItem>
            );
          })}
      </Menu>
    </Box>
  );
}
