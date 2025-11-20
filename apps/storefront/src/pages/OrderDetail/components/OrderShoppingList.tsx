import { useEffect, useState } from 'react';
import { Add as AddIcon } from '@mui/icons-material';
import { Box, ListItemText, MenuItem, MenuList, useTheme } from '@mui/material';

import B3Dialog from '@/components/B3Dialog';
import CustomButton from '@/components/button/CustomButton';
import { b3HexToRgb } from '@/components/outSideComponents/utils/b3CustomStyles';
import B3Spin from '@/components/spin/B3Spin';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';
import { getB2BShoppingList, getBcShoppingList } from '@/shared/service/b2b';
import { isB2BUserSelector, rolePermissionSelector, useAppSelector } from '@/store';
import { ShoppingListItem, ShoppingListStatus } from '@/types/shoppingList';
import { channelId } from '@/utils/basicConfig';

interface OrderShoppingListProps {
  isOpen: boolean;
  dialogTitle?: string;
  confirmText?: string;
  onClose?: () => void;
  onCreate?: () => void;
  onConfirm?: (id: string) => void;
  isLoading?: boolean;
  setLoading?: (val: boolean) => void;
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
    isLoading = false,
    setLoading = noop,
  } = props;

  const isB2BUser = useAppSelector(isB2BUserSelector);
  const role = useAppSelector(({ company }) => company.customer.role);
  const { submitShoppingListPermission } = useAppSelector(rolePermissionSelector);

  const theme = useTheme();
  const [isMobile] = useMobile();
  const primaryColor = theme.palette.primary.main;

  const [list, setList] = useState([]);
  const [activeId, setActiveId] = useState('');

  useEffect(() => {
    if (!isOpen) return;
    const getList = async () => {
      setLoading(true);
      setList([]);

      try {
        const filterStatus = submitShoppingListPermission
          ? ShoppingListStatus.Draft
          : ShoppingListStatus.Approved;

        const { edges: list = [] } = isB2BUser
          ? await getB2BShoppingList({ status: filterStatus })
          : await getBcShoppingList({ channelId });

        setList(list);
      } finally {
        setLoading(false);
      }
    };

    getList();
    // Disabling as the setLoading dispatcher does not need to be here
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isB2BUser, isOpen, role]);

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
      <B3Spin isSpinning={isLoading} isFlex={false}>
        <Box
          sx={
            isMobile
              ? {
                  height: '430px',
                }
              : {
                  padding: isLoading ? '4rem 0' : 'unset',
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
