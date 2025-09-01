import styled from '@emotion/styled';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { isB2BUserSelector, useAppSelector } from '@/store';
import { currencyFormat, displayFormat } from '@/utils';

import OrderStatus from './components/OrderStatus';

interface ListItem {
  orderId: string;
  firstName: string;
  lastName: string;
  poNumber?: string;
  status: string;
  totalIncTax: string;
  createdAt: string;
}

interface OrderItemCardProps {
  goToDetail: () => void;
  item: ListItem;
}

const Flex = styled('div')(() => ({
  display: 'flex',
  alignItems: 'center',
  '&.between-flex': {
    justifyContent: 'space-between',
  },
}));

export function OrderItemCard({ item, goToDetail }: OrderItemCardProps) {
  const theme = useTheme();
  const isB2BUser = useAppSelector(isB2BUserSelector);
  const customer = useAppSelector(({ company }) => company.customer);

  const getName = (item: ListItem) => {
    if (isB2BUser) {
      return `by ${item.firstName} ${item.lastName}`;
    }
    return `by ${customer.firstName} ${customer.lastName}`;
  };

  return (
    <Card key={item.orderId}>
      <CardContent sx={{ color: 'rgba(0, 0, 0, 0.6)' }} onClick={goToDetail}>
        <Flex className="between-flex">
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
            }}
          >
            <Typography
              variant="h5"
              sx={{
                color: 'rgba(0, 0, 0, 0.87)',
              }}
            >
              {`# ${item.orderId}`}
            </Typography>
            <Typography
              sx={{
                ml: 1,
              }}
              variant="body2"
            >
              {item.poNumber ? item.poNumber : '–'}
            </Typography>
          </Box>
          <Box>
            <OrderStatus code={item.status} />
          </Box>
        </Flex>

        <Typography
          variant="h6"
          sx={{
            marginBottom: theme.spacing(2.5),
            mt: theme.spacing(1.5),
            minHeight: '1.43em',
          }}
        >
          {currencyFormat(item.totalIncTax)}
        </Typography>

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
          }}
        >
          <Typography
            variant="body2"
            sx={{
              fontWeight: 'normal',
              marginRight: theme.spacing(2),
            }}
          >
            {getName(item)}
          </Typography>
          <Typography>{`${displayFormat(item.createdAt)}`}</Typography>
        </Box>
      </CardContent>
    </Card>
  );
}
