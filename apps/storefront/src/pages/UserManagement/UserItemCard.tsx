import styled from '@emotion/styled';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { B3Tag } from '@/components';

import { getUserRole, UsersList } from './config';

interface RoleListProps {
  label: string;
  value: string | number;
  color: string;
  textColor: string;
  idLang: string;
  name: string;
}

export interface OrderItemCardProps {
  item: UsersList;
  onEdit: (data: UsersList) => void;
  onDelete: (data: UsersList) => void;
  isPermissions: boolean;
}

const Flex = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
}));

export function UserItemCard(props: OrderItemCardProps) {
  const { item: userInfo, onEdit, onDelete, isPermissions } = props;

  const getNewRoleList = () => {
    const userRole = getUserRole();
    const newRoleList: Array<RoleListProps> = userRole.map((item) => {
      if (+item.value === 2) {
        if (userInfo.companyRoleName !== 'Junior Buyer') {
          return {
            color: '#ce93d8',
            textColor: 'black',
            ...item,
            label: userInfo.companyRoleName,
            name: userInfo.companyRoleName,
          };
        }
        return {
          color: '#D9DCE9',
          textColor: 'black',
          ...item,
        };
      }
      if (+item.value === 1) {
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
    <Card key={userInfo.id}>
      <CardContent
        sx={{
          color: '#313440',
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: 'rgba(0, 0, 0, 0.87)',
          }}
        >
          {userInfo.firstName} {userInfo.lastName}
        </Typography>

        <Typography
          sx={{
            p: '15px 0',
          }}
          variant="body1"
        >
          {userInfo.email}
        </Typography>
        <Flex>
          {statusRender(userInfo.companyRoleName)}
          <Box
            sx={{
              display: `${isPermissions ? 'block' : 'none'}`,
            }}
          >
            <IconButton
              aria-label="edit"
              size="small"
              sx={{
                marginRight: '8px',
              }}
              onClick={() => {
                onEdit(userInfo);
              }}
            >
              <EditIcon fontSize="inherit" />
            </IconButton>
            <IconButton
              aria-label="delete"
              size="small"
              onClick={() => {
                onDelete(userInfo);
              }}
            >
              <DeleteIcon fontSize="inherit" />
            </IconButton>
          </Box>
        </Flex>
      </CardContent>
    </Card>
  );
}
