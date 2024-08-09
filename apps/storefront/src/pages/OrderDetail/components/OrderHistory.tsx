import { useContext } from 'react';
import { useB3Lang } from '@b3/lang';
import styled from '@emotion/styled';
import { Card, CardContent, Typography } from '@mui/material';

import { B3Table, TableColumnItem } from '@/components/table/B3Table';
import { useMobile } from '@/hooks';
import { displayExtendedFormat } from '@/utils';

import { OrderHistoryItem, OrderStatusItem } from '../../../types';
import OrderStatus from '../../order/components/OrderStatus';
import { orderStatusTranslationVariables } from '../../order/shared/getOrderStatus';
import { OrderDetailsContext } from '../context/OrderDetailsContext';

const HistoryListContainer = styled('div')(() => ({
  '& > .MuiPaper-root': {
    boxShadow: 'none',
  },

  '& table': {
    '& td, & th': {
      '&:first-of-type': {
        paddingLeft: 0,
      },
    },
  },
}));

export default function OrderHistory() {
  const b3Lang = useB3Lang();
  const {
    state: { history = [], orderStatus: orderStatusLabel = [], customStatus },
  } = useContext(OrderDetailsContext);
  const [isMobile] = useMobile();

  const getOrderStatusLabel = (status: string) => {
    const currentOrderStatus = orderStatusLabel.find(
      (item: OrderStatusItem) => item.systemLabel === status,
    );

    let activeStatusLabel = currentOrderStatus?.customLabel || customStatus;

    if (currentOrderStatus) {
      const optionLabel = orderStatusTranslationVariables[currentOrderStatus.systemLabel];

      activeStatusLabel =
        optionLabel && b3Lang(optionLabel) !== currentOrderStatus.systemLabel
          ? b3Lang(optionLabel)
          : activeStatusLabel;
    }

    return activeStatusLabel;
  };

  const columnItems: TableColumnItem<OrderHistoryItem>[] = [
    {
      key: 'time',
      title: b3Lang('orderDetail.history.dateHeader'),
      render: (item: OrderHistoryItem) => `${displayExtendedFormat(item.createdAt)}`,
      width: isMobile ? '100px' : '200px',
    },
    {
      key: 'code',
      title: b3Lang('orderDetail.history.statusHeader'),
      render: (item: OrderHistoryItem) => (
        <OrderStatus code={item.status} text={getOrderStatusLabel(item.status)} />
      ),
    },
  ];

  return history.length > 0 ? (
    <Card>
      <CardContent
        sx={{
          paddingBottom: '50px',
        }}
      >
        <Typography variant="h5">{b3Lang('orderDetail.history.title')}</Typography>
        <HistoryListContainer>
          <B3Table columnItems={columnItems} listItems={history} showPagination={false} />
        </HistoryListContainer>
      </CardContent>
    </Card>
  ) : null;
}
