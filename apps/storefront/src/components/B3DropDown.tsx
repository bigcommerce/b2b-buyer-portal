import { forwardRef, Ref, useImperativeHandle, useRef, useState } from 'react';
import {
  ArrowDropDown as ArrowDropDownIcon,
  ArrowDropUp as ArrowDropUpIcon,
} from '@mui/icons-material';
import { Box, MenuProps } from '@mui/material';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';

import { useMobile } from '@/hooks/useMobile';
import { disableLogoutButton } from '@/utils';

export interface ListItemProps {
  name: string;
  key: string | number;
}

export interface DropDownHandle {
  setOpenDropDown: () => void;
}

interface B3DropDownProps extends Partial<MenuProps> {
  width?: string;
  list: Array<ListItemProps>;
  title: string;
  handleItemClick?: (key: string | number) => void;
  value?: string;
  menuRenderItemName?: (item: ListItemProps) => JSX.Element | string;
}

function B3DropDown(
  {
    width,
    list,
    title,
    value,
    handleItemClick,
    menuRenderItemName = (item) => item.name,
    ...menu
  }: B3DropDownProps,
  ref: Ref<DropDownHandle>,
) {
  const [isMobile] = useMobile();
  const [isOpen, setIsOpen] = useState(false);
  const listRef = useRef<HTMLDivElement | null>(null);

  useImperativeHandle(ref, () => ({
    setOpenDropDown: () => setIsOpen(true),
  }));

  const close = () => {
    setIsOpen(false);
  };

  return (
    <Box
      sx={{
        width: width || 'auto',
      }}
    >
      {!disableLogoutButton ? (
        <ListItemButton
          ref={listRef}
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
      ) : (
        <ListItemText
          primary={title}
          sx={{
            '& span': {
              fontWeight: isMobile ? 400 : 700,
              color: '#333333',
            },
          }}
        />
      )}
      <Menu
        anchorEl={listRef.current}
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

export default forwardRef<DropDownHandle, B3DropDownProps>(B3DropDown);
