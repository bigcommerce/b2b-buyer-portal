import styled from '@emotion/styled';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { B3Tag } from '@/components';
import { verifyLevelPermission } from '@/utils';
import { b2bPermissionsMap } from '@/utils/b3CheckPermissions/config';

import { getUserRole } from './config';

interface RoleListProps {
  label: string;
  value: string | number;
  color: string;
  textColor: string;
  idLang: string;
  name: string;
}

interface User {
  id: string;
  companyRoleName: string;
  firstName: string;
  lastName: string;
  email: string;
  companyInfo: {
    companyId: string;
  };
}

export type Edit = (userId: string) => void;
export type Delete = (userId: string) => void;

export interface OrderItemCardProps {
  item: User;
  onEdit: Edit;
  onDelete: Delete;
}

const Flex = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

export function UserItemCard(props: OrderItemCardProps) {
  const { item: userInfo, onEdit, onDelete } = props;
  const { companyInfo, id, companyRoleName, firstName, lastName, email } = userInfo;

  const { userUpdateActionsPermission, userDeleteActionsPermission } = b2bPermissionsMap;

  const updateActionsPermission = verifyLevelPermission({
    code: userUpdateActionsPermission,
    companyId: Number(companyInfo?.companyId || 0),
    userId: Number(id),
  });
  const deleteActionsPermission = verifyLevelPermission({
    code: userDeleteActionsPermission,
    companyId: Number(companyInfo?.companyId || 0),
    userId: Number(id),
  });

  const getNewRoleList = () => {
    const userRole = getUserRole();
    const newRoleList: Array<RoleListProps> = userRole.map((item) => {
      if (Number(item.value) === 2) {
        if (companyRoleName !== 'Junior Buyer') {
          return {
            color: '#ce93d8',
            textColor: 'black',
            ...item,
            label: companyRoleName,
            name: companyRoleName,
          };
        }

        return {
          color: '#D9DCE9',
          textColor: 'black',
          ...item,
        };
      }

      if (Number(item.value) === 1) {
        return {
          color: 'rgba(237, 108, 2, 0.3)',
          textColor: 'black',
          ...item,
        };
      }

      return {
        color: '#C4DD6C',
        textColor: 'black',
        ...item,
      };
    });

    return newRoleList;
  };

  const statusRender = (name: string) => {
    const newRoleList = getNewRoleList();
    const roleItem = newRoleList.find((item: RoleListProps) => item.name === name);

    if (!roleItem) return null;

    return (
      <B3Tag color={roleItem.color} textColor={roleItem.textColor}>
        {roleItem.label}
      </B3Tag>
    );
  };

  return (
    <Card key={id}>
      <CardContent
        sx={{
          color: '#313440',
        }}
      >
        <Typography
          sx={{
            color: 'rgba(0, 0, 0, 0.87)',
          }}
          variant="h5"
        >
          {firstName} {lastName}
        </Typography>

        <Typography
          sx={{
            p: '15px 0',
          }}
          variant="body1"
        >
          {email}
        </Typography>
        <Flex>
          {statusRender(companyRoleName)}
          <Box>
            {updateActionsPermission && (
              <IconButton
                aria-label="edit"
                onClick={() => onEdit(userInfo.id)}
                size="small"
                sx={{
                  marginRight: '8px',
                }}
              >
                <EditIcon fontSize="inherit" />
              </IconButton>
            )}
            {deleteActionsPermission && (
              <IconButton aria-label="delete" onClick={() => onDelete(userInfo.id)} size="small">
                <DeleteIcon fontSize="inherit" />
              </IconButton>
            )}
          </Box>
        </Flex>
      </CardContent>
    </Card>
  );
}
