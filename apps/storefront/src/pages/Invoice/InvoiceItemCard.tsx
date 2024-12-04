import { ReactElement } from 'react';
import { useNavigate } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import styled from '@emotion/styled';
import { Box, Card, CardContent, InputAdornment, TextField, Typography } from '@mui/material';

import { TableColumnItem } from '@/components/table/B3Table';
import { InvoiceList, InvoiceListNode } from '@/types/invoice';
import { currencyFormat, displayFormat } from '@/utils';

import B3Pulldown from './components/B3Pulldown';
import InvoiceStatus from './components/InvoiceStatus';

export interface InvoiceItemCardProps {
  item: any;
  checkBox?: (disable: boolean) => ReactElement;
  handleSetSelectedInvoiceAccount: (value: string, id: string) => void;
  handleViewInvoice: (id: string, status: string | number) => void;
  setIsRequestLoading: (bool: boolean) => void;
  setInvoiceId: (id: string) => void;
  handleOpenHistoryModal: (bool: boolean) => void;
  selectedPay: CustomFieldItems | InvoiceListNode[];
  handleGetCorrespondingCurrency: (code: string) => string;
  addBottom: boolean;
  isCurrentCompany: boolean;
  invoicePay: boolean;
}

const StyleCheckoutContainer = styled(Box)(() => ({
  '& > span': {
    padding: '0 9px 0 0',
  },
}));

export function InvoiceItemCard(props: InvoiceItemCardProps) {
  const currentDate = new Date().getTime();
  const {
    item,
    checkBox,
    handleSetSelectedInvoiceAccount,
    handleViewInvoice,
    setIsRequestLoading,
    setInvoiceId,
    handleOpenHistoryModal,
    selectedPay = [],
    handleGetCorrespondingCurrency,
    addBottom,
    isCurrentCompany,
    invoicePay,
  } = props;
  const b3Lang = useB3Lang();
  const navigate = useNavigate();

  const { id, status, dueDate, openBalance } = item;
  const currentCode = openBalance.code || 'USD';
  const currentCurrencyToken = handleGetCorrespondingCurrency(currentCode);

  let statusCode = item.status;
  if (status === 0 && currentDate > dueDate * 1000) {
    statusCode = 3;
  }

  const columnAllItems: TableColumnItem<InvoiceList>[] = [
    {
      key: 'orderNumber',
      title: b3Lang('invoice.invoiceItemCardHeader.order'),
      render: () => (
        <Box
          sx={{
            color: '#000000',
            cursor: 'pointer',
            textDecoration: 'underline',
          }}
          onClick={() => {
            navigate(`/orderDetail/${item.orderNumber}`);
          }}
        >
          {item?.orderNumber || '-'}
        </Box>
      ),
    },
    {
      key: 'createdAt',
      title: b3Lang('invoice.invoiceItemCardHeader.invoiceDate'),
      render: () => `${item.createdAt ? displayFormat(+item.createdAt) : '–'}`,
    },
    {
      key: 'updatedAt',
      title: b3Lang('invoice.invoiceItemCardHeader.dueDate'),
      render: () => {
        const { dueDate, status } = item;
        const isOverdue = currentDate > dueDate * 1000 && status !== 2;

        return (
          <Typography
            sx={{
              color: isOverdue ? '#D32F2F' : 'rgba(0, 0, 0, 0.87)',
              fontSize: '14px',
            }}
          >
            {`${item.dueDate ? displayFormat(+item.dueDate) : '–'}`}
          </Typography>
        );
      },
    },
    {
      key: 'originalBalance',
      title: b3Lang('invoice.invoiceItemCardHeader.invoiceTotal'),
      render: () => {
        const { originalBalance } = item;
        const originalAmount = +originalBalance.value;

        return currencyFormat(originalAmount || 0);
      },
    },
    {
      key: 'openBalance',
      title: b3Lang('invoice.invoiceItemCardHeader.amountDue'),
      render: () => {
        const { openBalance } = item;

        const openAmount = +openBalance.value;

        return currencyFormat(openAmount || 0);
      },
    },
    {
      key: 'openBalanceToPay',
      title: b3Lang('invoice.invoiceItemCardHeader.amountToPay'),
      render: () => {
        const { openBalance, id } = item;
        let valuePrice = openBalance.value;
        let disabled = true;

        if (selectedPay.length > 0) {
          const currentSelected = selectedPay.find((item: InvoiceListNode) => {
            const {
              node: { id: selectedId },
            } = item;

            return +selectedId === +id;
          });

          if (currentSelected) {
            const {
              node: { openBalance: selectedOpenBalance },
            } = currentSelected;

            disabled = false;
            valuePrice = selectedOpenBalance.value;

            if (+openBalance.value === 0) {
              disabled = true;
            }
          }
        }

        return (
          <TextField
            disabled={disabled}
            variant="filled"
            value={valuePrice}
            InputProps={{
              startAdornment: (
                <InputAdornment
                  position="start"
                  sx={{ padding: '8px 0', marginTop: '0 !important' }}
                >
                  {currentCurrencyToken || '$'}
                </InputAdornment>
              ),
            }}
            sx={{
              '& input': {
                paddingTop: '8px',
              },
            }}
            onChange={(e: CustomFieldItems) => {
              const val = e.target?.value;
              handleSetSelectedInvoiceAccount(val, id);
            }}
            type="number"
          />
        );
      },
    },
  ];

  return (
    <Card
      sx={{
        marginBottom: selectedPay.length > 0 && addBottom ? '5rem' : 0,
      }}
    >
      <CardContent
        sx={{
          color: 'rgba(0, 0, 0, 0.6)',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              mb: '0.5rem',
            }}
          >
            <StyleCheckoutContainer>
              {checkBox && checkBox(!!item?.disableCurrentCheckbox)}
            </StyleCheckoutContainer>
            <Typography
              variant="h6"
              sx={{
                color: 'rgba(0, 0, 0, 0.87)',
              }}
            >
              <Box
                sx={{
                  color: '#000000',
                  cursor: 'pointer',
                  textDecoration: 'underline',
                }}
                onClick={() => {
                  handleViewInvoice(id, status);
                }}
              >
                {id || '-'}
              </Box>
            </Typography>
          </Box>
          <Box sx={{ mb: '0.5rem' }}>
            <B3Pulldown
              row={item}
              setInvoiceId={setInvoiceId}
              handleOpenHistoryModal={handleOpenHistoryModal}
              setIsRequestLoading={setIsRequestLoading}
              isCurrentCompany={isCurrentCompany}
              invoicePay={invoicePay}
            />
          </Box>
        </Box>
        <Box sx={{ mb: '1rem' }}>
          <InvoiceStatus code={statusCode} />
        </Box>

        {columnAllItems.map((list: CustomFieldItems) => (
          <Box
            key={list.key}
            sx={{
              display: 'flex',
              alignItems: 'center',
              mt: '4px',
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
            <Box
              sx={{
                color: 'black',
                wordBreak: 'break-all',
              }}
            >
              {list?.render ? list.render() : item[list.key]}
            </Box>
          </Box>
        ))}
      </CardContent>
    </Card>
  );
}
