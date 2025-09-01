import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from '@emotion/styled';
import {
  ContentCopy as ContentCopyIcon,
  Delete as DeleteIcon,
  Edit as EditIcon,
} from '@mui/icons-material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import CustomButton from '@/components/button/CustomButton';
import { useB3Lang } from '@/lib/lang';
import { rolePermissionSelector, useAppSelector } from '@/store';
import { ShoppingListStatus } from '@/types/shoppingList';
import { displayFormat, verifyLevelPermission } from '@/utils';
import { b2bPermissionsMap } from '@/utils/b3CheckPermissions/config';

import { ShoppingListsItemsProps } from './config';
import { ShoppingListStatusTag } from './ShoppingListStatusTag';

interface OrderItemCardProps {
  item: ShoppingListsItemsProps;
  onEdit: (data: ShoppingListsItemsProps) => void;
  onDelete: (data: ShoppingListsItemsProps) => void;
  onCopy: (data: ShoppingListsItemsProps) => void;
  isPermissions: boolean;
  isB2BUser: boolean;
}

const Flex = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

const FontBold = styled(Typography)(() => ({
  fontWeight: '500',
  paddingRight: '5px',
}));

const FlexItem = styled(Box)(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'start',
}));

function ShoppingListsCard(props: OrderItemCardProps) {
  const { item: shoppingList, onEdit, onDelete, onCopy, isPermissions, isB2BUser } = props;
  const b3Lang = useB3Lang();

  const [isCanEditShoppingList, setIsCanEditShoppingList] = useState<boolean>(true);

  const { submitShoppingListPermission, approveShoppingListPermission } =
    useAppSelector(rolePermissionSelector);

  const getEditPermissions = (status: number) => {
    if (submitShoppingListPermission) {
      if (status === ShoppingListStatus.Draft || status === ShoppingListStatus.Approved)
        return false;
      return true;
    }

    if (status === ShoppingListStatus.ReadyForApproval) return true;

    return false;
  };

  const shoppingListCanBeDeleted = (status: number) => {
    if (!submitShoppingListPermission) {
      return true;
    }

    // Status code 20 was previously misused as Rejected in the frontend, which is actually Deleted
    // We need to add Deleted here so that the shopping lists that were previously rejected remain the same behavior
    const isInDeletableStatus =
      status === ShoppingListStatus.Deleted ||
      status === ShoppingListStatus.Draft ||
      status === ShoppingListStatus.Rejected;

    return isInDeletableStatus;
  };

  const navigate = useNavigate();

  const goToDetail = (shoppingList: ShoppingListsItemsProps) =>
    navigate(`/shoppingList/${shoppingList.id}`, {
      state: {
        from: 'shoppingList',
      },
    });

  useEffect(() => {
    if (isB2BUser) {
      const { companyInfo, customerInfo } = shoppingList;

      const { shoppingListCreateActionsPermission } = b2bPermissionsMap;
      const shoppingListActionsPermission = verifyLevelPermission({
        code: shoppingListCreateActionsPermission,
        companyId: Number(companyInfo?.companyId || 0),
        userId: Number(customerInfo.userId),
      });

      setIsCanEditShoppingList(shoppingListActionsPermission);
    }
  }, [shoppingList, isB2BUser]);

  return (
    <Card
      key={shoppingList.id}
      sx={{
        '& .b2b-card-content': {
          paddingBottom: '16px',
        },
      }}
    >
      <CardContent
        className="b2b-card-content"
        sx={{
          color: '#313440',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: 'rgba(0, 0, 0, 0.87)',
            width: '100%',
            wordBreak: 'break-all',
          }}
        >
          {shoppingList.name}
        </Typography>
        <Box
          sx={{
            pt: '8px',
            pb: '20px',
          }}
        >
          {isB2BUser &&
            (submitShoppingListPermission ||
              (approveShoppingListPermission && shoppingList.approvedFlag)) && (
              <Box
                sx={{
                  pb: '25px',
                }}
              >
                <ShoppingListStatusTag status={shoppingList.status} />
              </Box>
            )}
          <Box
            sx={{
              width: '100%',
              wordBreak: 'break-all',
            }}
          >
            {shoppingList.description}
          </Box>

          {isB2BUser && (
            <FlexItem>
              <FontBold>{b3Lang('shoppingLists.card.createdBy')}</FontBold>
              {shoppingList.customerInfo.firstName} {shoppingList.customerInfo.lastName}
            </FlexItem>
          )}
          <FlexItem>
            <FontBold>{b3Lang('shoppingLists.card.products')}</FontBold>
            {shoppingList.products.totalCount}
          </FlexItem>
          <FlexItem>
            <FontBold>{b3Lang('shoppingLists.card.lastActivity')}</FontBold>
            {`${displayFormat(shoppingList.updatedAt)}`}
          </FlexItem>
        </Box>
        <Flex>
          <CustomButton
            sx={{
              m: '0 0 0 -8px',
              minWidth: 0,
            }}
            variant="text"
            onClick={() => goToDetail(shoppingList)}
          >
            {b3Lang('shoppingLists.card.view')}
          </CustomButton>
          <Box
            sx={{
              display: isPermissions ? 'block' : 'none',
            }}
          >
            {!getEditPermissions(shoppingList.status) && isCanEditShoppingList && (
              <IconButton
                aria-label="edit"
                size="medium"
                sx={{
                  marginRight: '8px',
                }}
                onClick={() => {
                  onEdit(shoppingList);
                }}
              >
                <EditIcon fontSize="inherit" />
              </IconButton>
            )}

            <IconButton
              aria-label="duplicate"
              size="medium"
              sx={{
                marginRight: '8px',
              }}
              onClick={() => {
                onCopy(shoppingList);
              }}
            >
              <ContentCopyIcon fontSize="inherit" />
            </IconButton>
            {shoppingListCanBeDeleted(shoppingList.status) && isCanEditShoppingList && (
              <IconButton
                aria-label="delete"
                size="medium"
                onClick={() => {
                  onDelete(shoppingList);
                }}
              >
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            )}
          </Box>
        </Flex>
      </CardContent>
    </Card>
  );
}

export default ShoppingListsCard;
