import { useEffect, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import { Box, Button, Grid, Typography } from '@mui/material';

import { useMobile } from '@/hooks';
import { useAppSelector } from '@/store';
import { BcCartData, BcCartDataLineItem, InvoiceListNode } from '@/types/invoice';
import { handleGetCorrespondingCurrencyToken, snackbar } from '@/utils';

import { formattingNumericValues, gotoInvoiceCheckoutUrl } from '../utils/payment';

interface InvoiceFooterProps {
  selectedPay: CustomFieldItems;
  decimalPlaces: number;
}

function InvoiceFooter(props: InvoiceFooterProps) {
  const platform = useAppSelector(({ global }) => global.storeInfo.platform);
  const b3Lang = useB3Lang();
  const [isMobile] = useMobile();
  const [selectedAccount, setSelectedAccount] = useState<number | string>(0);
  const [currentToken, setCurrentToken] = useState<string>('$');

  const isAgenting = useAppSelector(({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting);

  const containerStyle = isMobile
    ? {
        alignItems: 'flex-start',
        flexDirection: 'column',
      }
    : {
        alignItems: 'center',
      };

  const { selectedPay, decimalPlaces } = props;

  const handlePay = async () => {
    const lineItems: BcCartDataLineItem[] = [];
    let currency = 'SGD';

    if (selectedPay.length > 0) {
      selectedPay.forEach((item: InvoiceListNode) => {
        const {
          node: { id, openBalance, originalBalance },
        } = item;

        const currentValue =
          formattingNumericValues(+openBalance.originValue, decimalPlaces) === openBalance.value
            ? +openBalance.originValue
            : +openBalance.value;
        lineItems.push({
          invoiceId: +id,
          amount: openBalance.value === '.' ? '0' : `${+currentValue}`,
        });

        currency = openBalance?.code || originalBalance.code;
      });

      const badItem = lineItems.find(
        (item: CustomFieldItems) => item.amount === '.' || +item.amount === 0,
      );
      if (badItem) {
        snackbar.error(b3Lang('invoice.footer.invalidNameError'), {
          isClose: true,
        });

        return;
      }

      const params: BcCartData = {
        lineItems,
        currency,
      };

      await gotoInvoiceCheckoutUrl(params, platform, false);
    }
  };

  useEffect(() => {
    if (selectedPay.length > 0) {
      const handleStatisticsInvoiceAmount = (checkedArr: CustomFieldItems) => {
        let amount = 0;

        checkedArr.forEach((item: InvoiceListNode) => {
          const {
            node: { openBalance },
          } = item;
          amount += openBalance.value === '.' ? 0 : +openBalance.value;
        });

        setSelectedAccount(formattingNumericValues(amount, decimalPlaces));
      };
      const {
        node: { openBalance },
      } = selectedPay[0];

      const token = handleGetCorrespondingCurrencyToken(openBalance.code);
      setCurrentToken(token);
      handleStatisticsInvoiceAmount(selectedPay);
    }
  }, [decimalPlaces, selectedPay]);

  return (
    <Grid
      sx={{
        position: 'fixed',
        bottom: isMobile && isAgenting ? '52px' : 0,
        left: 0,
        backgroundColor: '#fff',
        width: '100%',
        padding: isMobile ? '0 0 1rem 0' : '0 40px 1rem 40px',
        height: isMobile ? '8rem' : 'auto',
        marginLeft: 0,
        display: 'flex',
        flexWrap: 'nowrap',
        zIndex: '999',
      }}
      container
      spacing={2}
    >
      <Grid
        item
        sx={{
          display: isMobile ? 'none' : 'block',
          width: '290px',
          paddingLeft: '20px',
        }}
      />
      <Grid
        item
        sx={
          isMobile
            ? {
                flexBasis: '100%',
              }
            : {
                flexBasis: '690px',
                flexGrow: 1,
              }
        }
      >
        <Box
          sx={{
            width: '100%',
            pr: '20px',
            display: 'flex',
            zIndex: '999',
            justifyContent: 'space-between',
            ...containerStyle,
          }}
        >
          <Typography
            sx={{
              color: '#000000',
              fontSize: '16px',
              fontWeight: '400',
            }}
          >
            {b3Lang('invoice.footer.invoiceSelected', {
              invoices: selectedPay.length,
            })}
          </Typography>
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: isMobile ? 'wrap' : 'nowrap',
              width: isMobile ? '100%' : 'auto',
            }}
          >
            <Typography
              variant="h6"
              sx={{
                fontSize: '16px',
                fontWeight: '700',
                color: '#000000',
              }}
            >
              {b3Lang('invoice.footer.totalPayment', {
                total: `${currentToken}${selectedAccount}`,
              })}
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                marginTop: isMobile ? '0.5rem' : 0,
                width: isMobile ? '100%' : 'auto',
              }}
            >
              <Button
                variant="contained"
                sx={{
                  marginLeft: isMobile ? 0 : '1rem',
                  width: isMobile ? '100%' : 'auto',
                }}
                onClick={() => {
                  handlePay();
                }}
              >
                {b3Lang('invoice.footer.payInvoices')}
              </Button>
            </Box>
          </Box>
        </Box>
      </Grid>
      <Grid
        item
        sx={
          isMobile
            ? {
                flexBasis: '100%',
                display: isMobile ? 'none' : 'block',
              }
            : {
                flexBasis: '0',
                display: isMobile ? 'none' : 'block',
              }
        }
      />
    </Grid>
  );
}

export default InvoiceFooter;
