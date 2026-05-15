import { useMemo } from 'react';
import styled from '@emotion/styled';
import { useTheme } from '@mui/material';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';

import { TableColumnItem } from '@/components/table/B3Table';
import { useB3Lang } from '@/lib/lang';
import { DisplayCurrency } from '@/types/currency';
import { currencyFormatConvert } from '@/utils/b3CurrencyFormat';
import { displayFormat } from '@/utils/b3DateFormat';

import QuoteStatus from '../quote/components/QuoteStatus';

interface ListItem {
  [key: string]: string | Object | undefined;
  status: string;
  quoteNumber: string;
  currency?: CurrencyProps | DisplayCurrency;
}

interface QuoteItemCardProps {
  goToDetail: (val: ListItem, status: number) => void;
  item: ListItem;
  currenciesMap: Record<string, DisplayCurrency>;
  isCurrencySymbolPlacementFixEnabled: boolean;
}

const Flex = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'start',
  marginBottom: '1rem',
});

export function QuoteItemCard(props: QuoteItemCardProps) {
  const { item, goToDetail, currenciesMap, isCurrencySymbolPlacementFixEnabled } = props;
  const theme = useTheme();
  const b3Lang = useB3Lang();

  const primaryColor = theme.palette.primary.main;

  const getTotalAmount = useMemo(() => {
    const { totalAmount, currency } = item;
    const currencyCode = currency?.currencyCode;
    const effectiveCurrency =
      (isCurrencySymbolPlacementFixEnabled && currencyCode && currenciesMap[currencyCode]) ||
      currency;
    return currencyFormatConvert(Number(totalAmount), {
      currency: effectiveCurrency,
      isConversionRate: false,
      useCurrentCurrency: !!effectiveCurrency,
    });
  }, [item, isCurrencySymbolPlacementFixEnabled, currenciesMap]);

  const columnAllItems: TableColumnItem<ListItem>[] = [
    {
      key: 'quoteTitle',
      title: b3Lang('quotes.quoteItemCard.title'),
    },
    {
      key: 'salesRepEmail',
      title: b3Lang('quotes.quoteItemCard.salesRep'),
    },
    {
      key: 'createdBy',
      title: b3Lang('quotes.quoteItemCard.createdBy'),
    },
    {
      key: 'createdAt',
      title: b3Lang('quotes.quoteItemCard.dateCreated'),
      render: () =>
        `${Number(item.status) !== 0 ? displayFormat(Number(item.createdAt)) : item.createdAt}`,
    },
    {
      key: 'updatedAt',
      title: b3Lang('quotes.quoteItemCard.lastUpdate'),
      render: () =>
        `${Number(item.status) !== 0 ? displayFormat(Number(item.updatedAt)) : item.updatedAt}`,
    },
    {
      key: 'expiredAt',
      title: b3Lang('quotes.quoteItemCard.expirationDate'),
      render: () =>
        `${Number(item.status) !== 0 ? displayFormat(Number(item.expiredAt)) : item.expiredAt}`,
    },
    {
      key: 'totalAmount',
      title: b3Lang('quotes.quoteItemCard.subtotal'),
      render: () => getTotalAmount,
    },
  ];

  return (
    <Card>
      <CardContent
        sx={{
          color: 'rgba(0, 0, 0, 0.6)',
        }}
      >
        <Flex>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: '1rem',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(0, 0, 0, 0.87)',
              }}
            >
              {item.quoteNumber}
            </Typography>
          </Box>
          <Box>
            <QuoteStatus code={item.status} />
          </Box>
        </Flex>

        {columnAllItems.map((list: any) => (
          <Box
            key={list.key}
            sx={{
              display: 'flex',
            }}
          >
            <Typography
              sx={{
                fontWeight: 'bold',
                color: 'rgba(0, 0, 0, 0.87)',
                mr: '5px',
                whiteSpace: 'nowrap',
              }}
            >
              {`${list.title}:`}
            </Typography>
            <Typography
              sx={{
                color: 'black',
                wordBreak: 'break-all',
              }}
            >
              {list?.render ? list.render() : item[list.key]}
            </Typography>
          </Box>
        ))}

        <Box
          onClick={() => goToDetail(item, Number(item.status))}
          sx={{
            mt: '1rem',
            pl: 0,
            color: primaryColor || '#1976D2',
            cursor: 'pointer',
            fontWeight: 'bold',
            display: 'inline-block',
          }}
        >
          {b3Lang('quotes.quoteItemCard.view')}
        </Box>
      </CardContent>
    </Card>
  );
}
