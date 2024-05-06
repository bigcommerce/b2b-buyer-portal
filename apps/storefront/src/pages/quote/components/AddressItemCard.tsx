import { useB3Lang } from '@b3/lang';
import styled from '@emotion/styled';
import { Theme, useTheme } from '@mui/material';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { B3Tag } from '@/components';
import CustomButton from '@/components/button/CustomButton';

import { AddressItemType } from '../../../types/address';

export interface OrderItemCardProps {
  item: AddressItemType;
  onSetAddress: (data: AddressItemType) => void;
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

export function AddressItemCard(props: OrderItemCardProps) {
  const { item: addressInfo, onSetAddress } = props;

  const theme = useTheme();

  const b3Lang = useB3Lang();

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
                addressInfo.isDefaultShipping === 1 || addressInfo.isDefaultBilling === 1
                  ? theme.spacing(1)
                  : theme.spacing(3),
              color: 'rgba(0, 0, 0, 0.87)',
            }}
          >
            {addressInfo.label}
          </Typography>
        )}

        <TagBox
          marginBottom={
            addressInfo.isDefaultShipping === 1 || addressInfo.isDefaultBilling === 1
              ? theme.spacing(3)
              : 0
          }
        >
          {addressInfo.isDefaultShipping === 1 && (
            <B3Tag color="#C4DD6C" textColor="rgba(0, 0, 0, 0.87)">
              {b3Lang('quoteDraft.addressItemCard.defaultShipping')}
            </B3Tag>
          )}
          {addressInfo.isDefaultBilling === 1 && (
            <B3Tag color="#C4DD6C" textColor="rgba(0, 0, 0, 0.87)">
              {b3Lang('quoteDraft.addressItemCard.defaultBilling')}
            </B3Tag>
          )}
        </TagBox>

        <Typography variant="body1">{`${addressInfo.firstName} ${addressInfo.lastName}`}</Typography>
        <Typography variant="body1">{addressInfo.company || ''}</Typography>
        <Typography variant="body1">{addressInfo.addressLine1}</Typography>
        <Typography variant="body1">{addressInfo.addressLine2}</Typography>
        <Typography variant="body1">{`${addressInfo.city}, ${addressInfo.state} ${addressInfo.zipCode}, ${addressInfo.country}`}</Typography>
        <Typography variant="body1">{addressInfo.phoneNumber}</Typography>

        <Flex>
          <CustomButton
            variant="text"
            onClick={() => {
              onSetAddress(addressInfo);
            }}
          >
            {b3Lang('quoteDraft.addressItemCard.chooseAddress')}
          </CustomButton>
        </Flex>
      </CardContent>
    </Card>
  );
}
