import { useRef, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import ArrowDropDownIcon from '@mui/icons-material/ArrowDropDown';
import ArrowDropUpIcon from '@mui/icons-material/ArrowDropUp';
import { Box } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { useMobile } from '@/hooks';

type ConfigProps = {
  name: string;
  key: string | number;
};

interface B3DropDownProps<T> {
  width?: string;
  list: Array<T>;
  config?: ConfigProps;
  title: string;
  handleItemClick: (arg0: T) => void;
  value?: string;
}

export default function B3DropDown<T>({
  width,
  list,
  config,
  title,
  value,
  handleItemClick,
}: B3DropDownProps<T>) {
  const [isMobile] = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);
  const b3Lang = useB3Lang();

  const close = () => {
    setIsOpen(false);
  };

  const keyName = config?.name || 'name';

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
          },
        }}
      >
        {list.length &&
          list.map((item: any) => {
            const name = item[keyName];
            const color = value === item.key ? '#3385d6' : 'black';
            return (
              <MenuItem
                sx={{
                  color,
                  width: isMobile ? 'auto' : width || '155px',
                }}
                key={name}
                onClick={() => {
                  close();
                  handleItemClick(item);
                }}
              >
                {b3Lang('global.button.logout')}
              </MenuItem>
            );
          })}
      </Menu>
    </Box>
  );
}
