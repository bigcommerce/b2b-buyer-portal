import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useB3Lang } from '@b3/lang';
import { Box, Button, Typography } from '@mui/material';

import { B3NoData } from '@/components';
import B3Dialog from '@/components/B3Dialog';
import B3Spin from '@/components/spin/B3Spin';
import { useMobile } from '@/hooks';
import { getInvoicePaymentInfo } from '@/shared/service/b2b';
import { InvoiceSuccessData, ReceiptLineSet } from '@/types/invoice';
import { displayFormat, handleGetCorrespondingCurrency } from '@/utils';

import InvoiceListType from '../utils/config';

interface PaymentSuccessKeysProps {
  key: string;
  label: string;
  type: string;
  isRow: boolean;
  idLang: string;
}

function Title({ title, withColon = true }: { title: string; withColon?: boolean }) {
  return (
    <Typography
      sx={{
        fontWeight: 'bold',
        pr: '5px',
      }}
    >
      {withColon ? `${title}:` : title}
    </Typography>
  );
}

interface RowProps {
  isRow?: boolean;
  type: string;
  value: string | number;
  label: string;
  code: string;
}
function Row({ isRow = true, type = '', value, label, code }: RowProps) {
  const getNewVal = (): string | number | Date => {
    if (type === 'time') {
      return displayFormat(+value) || '';
    }
    if (type === 'currency') {
      const val = +(value || 0);
      const accountValue = handleGetCorrespondingCurrency(code, val);
      return accountValue;
    }
    if (type === 'paymentType') {
      let val = `${value}`.trim();

      if (value) {
        val = val.slice(0, 1).toUpperCase() + val.slice(1).toLowerCase();
      }

      return val;
    }
    return value || '–';
  };

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: isRow ? 'row' : 'column',
      }}
    >
      <Title title={label} />
      <Typography variant="body1">{`${getNewVal()}`}</Typography>
    </Box>
  );
}

function PaymentSuccessList({ list }: { list: InvoiceSuccessData }) {
  const {
    receiptLineSet: { edges = [] },
    details,
  } = list;

  const comment = details?.paymentDetails?.comment || '';

  const b3Lang = useB3Lang();

  const paymentSuccessKeys = [
    {
      key: 'paymentId',
      label: 'Payment#',
      type: '',
      isRow: true,
      idLang: 'payment.paymentNumber',
    },
    {
      key: 'createdAt',
      label: 'Payment received on',
      type: 'time',
      isRow: true,
      idLang: 'payment.paymentReceivedOn',
    },
    {
      key: 'transactionType',
      label: 'Transaction type',
      type: '',
      isRow: true,
      idLang: 'payment.transactionType',
    },
    {
      key: 'paymentType',
      label: 'Payment type',
      type: 'paymentType',
      isRow: true,
      idLang: 'payment.paymentType',
    },
    {
      key: 'totalAmount',
      label: 'Payment total',
      type: 'currency',
      isRow: true,
      idLang: 'payment.paymentTotal',
    },
    {
      key: 'referenceNumber',
      label: 'Reference',
      type: '',
      isRow: true,
      idLang: 'payment.reference',
    },
  ];

  return (
    <Box>
      {paymentSuccessKeys.map((item: PaymentSuccessKeysProps) => (
        <Row
          isRow={!!item.isRow}
          type={item.type}
          value={(list as CustomFieldItems)[item.key]}
          code={(list as CustomFieldItems)?.totalCode || 'SGD'}
          label={b3Lang(item.idLang)}
        />
      ))}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          mb: '30px',
        }}
      >
        <Title title={b3Lang('payment.paymentComment')} />
        <Typography
          sx={{
            maxHeight: '50px',
          }}
        >
          {comment}
        </Typography>
      </Box>

      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Title title={b3Lang('payment.invoicesPaid')} withColon={false} />
        <Typography variant="body1">{b3Lang('payment.paymentTowardsInvoices')} </Typography>
      </Box>

      <Box>
        <Box
          sx={{
            borderBottom: '1px solid #D9DCE9',
            padding: '20px 15px',
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: 500,
          }}
        >
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#000000',
            }}
          >
            {b3Lang('payment.invoiceNumber')}
          </Typography>
          <Typography
            sx={{
              fontSize: '14px',
              fontWeight: '500',
              color: '#000000',
            }}
          >
            {b3Lang('payment.amountPaid')}
          </Typography>
        </Box>
        {edges.map((item: ReceiptLineSet) => {
          const {
            invoiceNumber,
            amount: { value, code },
          } = item.node;
          const val = +(value || 0);

          const accountValue = handleGetCorrespondingCurrency(code, val);
          return (
            <Box
              sx={{
                borderBottom: '1px solid #D9DCE9',
                padding: '20px 15px',
                display: 'flex',
                justifyContent: 'space-between',
              }}
            >
              <Typography>{invoiceNumber}</Typography>
              <Typography>{accountValue}</Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
}

interface PaymentSuccessProps {
  receiptId: number | number;
  type: string;
}

function PaymentSuccess({ receiptId, type }: PaymentSuccessProps) {
  const [isMobile] = useMobile();
  const [loadding, setLoadding] = useState<boolean>(false);

  const [open, setOpen] = useState<boolean>(false);

  const [detailData, setDetailData] = useState<InvoiceSuccessData | null>(null);

  const navigate = useNavigate();

  const b3Lang = useB3Lang();

  useEffect(() => {
    const init = async () => {
      setLoadding(true);
      const { receipt } = await getInvoicePaymentInfo(+receiptId);

      setDetailData(receipt);
      setOpen(true);
      setLoadding(false);
    };

    if (type === InvoiceListType.CHECKOUT && receiptId) {
      init();
    }
  }, [receiptId, type]);

  const handleCloseClick = () => {
    setOpen(false);
    navigate('/invoice');
  };
  const customActions = () => (
    <Button onClick={handleCloseClick} variant="text">
      {b3Lang('payment.okButton')}
    </Button>
  );

  return (
    <B3Dialog
      isOpen={open}
      leftSizeBtn=""
      customActions={customActions}
      title={b3Lang('payment.paymentSuccess')}
      showLeftBtn={false}
    >
      <Box
        sx={{
          width: isMobile ? '100%' : `${'384px'}`,
          maxHeight: '600px',
        }}
      >
        <B3Spin isSpinning={loadding}>
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              flex: 1,
            }}
          >
            {detailData ? <PaymentSuccessList list={detailData} /> : <B3NoData />}
          </Box>
        </B3Spin>
      </Box>
    </B3Dialog>
  );
}

export default PaymentSuccess;
