import { useEffect, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import AddIcon from '@mui/icons-material/Add';
import { Box, ListItemText, MenuItem, MenuList, useTheme } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import CustomButton from '@/components/button/CustomButton';
import { b3HexToRgb } from '@/components/outSideComponents/utils/b3CustomStyles';
import B3Spin from '@/components/spin/B3Spin';
import { useMobile } from '@/hooks';
import { useShoppingLists } from '@/hooks/dom/useShoppingLists';
import { isB2BUserSelector, useAppSelector } from '@/store';
import { ShoppingListItem } from '@/types/shoppingList';

interface OrderShoppingListProps {
  isOpen: boolean;
  dialogTitle?: string;
  confirmText?: string;
  onClose?: () => void;
  onCreate?: () => void;
  onConfirm?: (id: string) => void;
  setLoading?: (val: boolean) => void;
  isLoading?: boolean;
}

interface ListItem {
  node: ShoppingListItem;
}

const noop = () => {};

export default function OrderShoppingList(props: OrderShoppingListProps) {
  const b3Lang = useB3Lang();
  const {
    isOpen,
    dialogTitle = b3Lang('global.orderShoppingList.confirm'),
    confirmText = b3Lang('global.orderShoppingList.ok'),
    onClose = noop,
    onConfirm = noop,
    onCreate = noop,
    setLoading = noop,
    isLoading: isParentLoading
  } = props;

  const [activeId, setActiveId] = useState('');
  const { list, isLoading } = useShoppingLists();
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const theme = useTheme();
  const [isMobile] = useMobile();
  const primaryColor = theme.palette.primary.main;

  useEffect(() => {
    if (!isOpen) return;
    setLoading(isLoading);
  }, [isB2BUser, isOpen, isLoading, setLoading]);

  const handleClose = () => {
    onClose();
  };

  const handleConfirm = () => {
    onConfirm(activeId);
  };

  const handleCreate = () => {
    onCreate();
  };

  const handleListItemClicked = (item: ListItem) => () => {
    setActiveId(item.node.id);
  };

  return (
    <B3Dialog
      fullWidth
      isOpen={isOpen}
      title={dialogTitle}
      disabledSaveBtn={!activeId}
      handleLeftClick={handleClose}
      handRightClick={handleConfirm}
      rightSizeBtn={confirmText}
    >
      <B3Spin isSpinning={isLoading || isParentLoading} isFlex={false}>
        <Box
          sx={
            isMobile
              ? {
                  height: '430px',
                }
              : {
                  padding: isLoading || isParentLoading ? '4rem 0' : 'unset',
                  maxHeight: '430PX',
                }
          }
        >
          <MenuList
            sx={{
              maxHeight: '400px',
              width: '100%',
              overflowY: 'auto',
            }}
          >
            {list.map((item: ListItem) => (
              <MenuItem
                key={item.node.id}
                className={activeId === item.node.id ? 'active' : ''}
                onClick={handleListItemClicked(item)}
                sx={{
                  '&:hover': {
                    backgroundColor: b3HexToRgb(primaryColor, 0.12),
                  },
                  '&.active': {
                    backgroundColor: b3HexToRgb(primaryColor, 0.12),
                  },
                }}
              >
                <ListItemText>{item.node.name}</ListItemText>
              </MenuItem>
            ))}
          </MenuList>
        </Box>

        <CustomButton
          variant="text"
          onClick={handleCreate}
          sx={{
            textTransform: 'none',
          }}
        >
          <AddIcon
            sx={{
              fontSize: '17px',
            }}
          />
          {` ${b3Lang('global.orderShoppingList.createNew')}`}
        </CustomButton>
      </B3Spin>
    </B3Dialog>
  );
}
