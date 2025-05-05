import { PropsWithChildren } from 'react';
import { useB3Lang } from '@b3/lang';
import styled from '@emotion/styled';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { Theme, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { B3Tag } from '@/components';
import CustomButton from '@/components/button/CustomButton';

import { AddressItemType } from '../../../types/address';

export interface OrderItemCardProps {
  item: AddressItemType;
  canEdit: boolean;
  onEdit: () => void;
  canDelete: boolean;
  onDelete: () => void;
  canSetDefault: boolean;
  onSetDefault: () => void;
}

interface TagBoxProps {
  marginBottom: number | string;
}

const TagBox = styled('div')(({ marginBottom }: TagBoxProps) => ({
  marginBottom,
  '& > span:not(:last-child)': {
    marginRight: '4px',
  },
}));

interface FlexProps {
  theme?: Theme;
}

const Flex = styled('div')(({ theme }: FlexProps) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  marginTop: theme!.spacing(3),
}));

function Tag({ children }: PropsWithChildren) {
  return (
    <B3Tag color="#C4DD6C" textColor="rgba(0, 0, 0, 0.87)">
      {children}
    </B3Tag>
  );
}

function Text({ children }: PropsWithChildren) {
  return <Typography variant="body1">{children}</Typography>;
}

export function AddressItemCard({
  item: addressInfo,
  onEdit,
  onDelete,
  onSetDefault,
  canEdit,
  canDelete,
  canSetDefault,
}: OrderItemCardProps) {
  const theme = useTheme();
  const b3Lang = useB3Lang();
  const hasPermission = canEdit || canDelete || canSetDefault;

  const isDefaultShipping = addressInfo.isDefaultShipping === 1;
  const isDefaultBilling = addressInfo.isDefaultBilling === 1;

  return (
    <Card key={addressInfo.id}>
      <CardContent
        sx={{
          color: '#313440',
          wordBreak: 'break-word',
        }}
      >
        {addressInfo.label && (
          <Typography
            variant="h5"
            sx={{
              marginBottom:
                isDefaultShipping || isDefaultBilling ? theme.spacing(1) : theme.spacing(3),
              color: 'rgba(0, 0, 0, 0.87)',
            }}
          >
            {addressInfo.label}
          </Typography>
        )}

        <TagBox marginBottom={isDefaultShipping || isDefaultBilling ? theme.spacing(3) : 0}>
          {isDefaultShipping && <Tag>{b3Lang('addresses.addressItemCard.defaultShipping')}</Tag>}
          {isDefaultBilling && <Tag>{b3Lang('addresses.addressItemCard.defaultBilling')}</Tag>}
        </TagBox>

        <Text>
          {addressInfo.firstName} {addressInfo.lastName}
        </Text>
        <Text>{addressInfo.company || ''}</Text>
        <Text>{addressInfo.addressLine1}</Text>
        <Text>{addressInfo.addressLine2 === 'undefined' ? '' : addressInfo.addressLine2}</Text>
        <Text>
          {addressInfo.city}, {addressInfo.state} {addressInfo.zipCode}, {addressInfo.country}
        </Text>
        <Text>{addressInfo.phoneNumber}</Text>

        {hasPermission && (
          <Flex>
            {canSetDefault && (
              <CustomButton
                variant="text"
                sx={{
                  ml: '-8px',
                }}
                onClick={onSetDefault}
              >
                {b3Lang('addresses.addressItemCard.setAsDefault')}
              </CustomButton>
            )}
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                justifyContent: 'flex-end',
                gap: '8px',
              }}
            >
              {canEdit && (
                <IconButton aria-label="edit" size="small" onClick={onEdit}>
                  <EditIcon fontSize="inherit" />
                </IconButton>
              )}

              {canDelete && (
                <IconButton aria-label="delete" size="small" onClick={onDelete}>
                  <DeleteIcon fontSize="inherit" />
                </IconButton>
              )}
            </Box>
          </Flex>
        )}
      </CardContent>
    </Card>
  );
}
