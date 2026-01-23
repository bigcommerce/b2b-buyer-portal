import { PropsWithChildren } from 'react';
import styled from '@emotion/styled';
import { Delete as DeleteIcon, Edit as EditIcon } from '@mui/icons-material';
import { Theme, useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import IconButton from '@mui/material/IconButton';
import Typography from '@mui/material/Typography';

import { B3Tag } from '@/components/B3Tag';
import CustomButton from '@/components/button/CustomButton';
import { useB3Lang } from '@/lib/lang';

import { AddressItemType } from '../../../types/address';

interface OrderItemCardProps {
  item: AddressItemType;
  onEdit?: () => void;
  onDelete?: () => void;
  onSetDefault?: () => void;
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
}: OrderItemCardProps) {
  const theme = useTheme();
  const b3Lang = useB3Lang();
  const hasPermission = Boolean(onEdit || onDelete || onSetDefault);

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
            sx={{
              marginBottom:
                isDefaultShipping || isDefaultBilling ? theme.spacing(1) : theme.spacing(3),
              color: 'rgba(0, 0, 0, 0.87)',
            }}
            variant="h5"
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
            {onSetDefault && (
              <CustomButton
                onClick={onSetDefault}
                sx={{
                  ml: '-8px',
                }}
                variant="text"
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
              {onEdit && (
                <IconButton aria-label="edit" onClick={onEdit} size="small">
                  <EditIcon fontSize="inherit" />
                </IconButton>
              )}

              {onDelete && (
                <IconButton aria-label="delete" onClick={onDelete} size="small">
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
