import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Box } from '@mui/material';

import { Loading } from '@/components';
import B3Dialog from '@/components/B3Dialog';
import { useB3Lang } from '@/lib/lang';
import { getInvoiceDetail } from '@/shared/service/b2b/graphql/invoice';
import { useAppSelector } from '@/store';
import { snackbar } from '@/utils';

import { gotoInvoiceCheckoutUrl } from '../Invoice/utils/payment';

function Payment() {
  const platform = useAppSelector(({ global }) => global.storeInfo.platform);
  const B2BToken = useAppSelector(({ company }) => company.tokens.B2BToken);

  const [loading, setLoading] = useState<boolean>(false);

  const [open, setOpen] = useState<boolean>(false);

  const params = useParams();

  const navigate = useNavigate();

  const b3Lang = useB3Lang();

  useEffect(() => {
    const init = async () => {
      setLoading(true);

      if (!B2BToken) {
        setOpen(true);
        setLoading(false);
        return;
      }

      if (!params?.id) {
        snackbar.error(b3Lang('payment.errorInvoiceCantBeBlank'));
      }

      if (params?.id) {
        try {
          const {
            invoice: {
              openBalance: { code = '', value = '' },
            },
          } = await getInvoiceDetail(Number(params.id));

          if (!code || !value) {
            snackbar.error(b3Lang('payment.errorOpenBalanceIsIncorrect'));
          }

          const data = {
            lineItems: [
              {
                invoiceId: Number(params.id),
                amount: value,
              },
            ],
            currency: code,
          };

          await gotoInvoiceCheckoutUrl(data, platform, true);
        } catch (error: unknown) {
          snackbar.error(
            (error as CustomFieldItems)?.message || b3Lang('payment.invoiceDoesNotExist'),
          );
        } finally {
          setLoading(false);
        }
      }
    };

    init();
  }, [platform, params.id, B2BToken, b3Lang]);

  const handleConfirm = () => {
    navigate('/login');
  };

  return (
    <Box>
      {loading && <Loading backColor="#FFFFFF" />}
      <B3Dialog
        isOpen={open}
        fullWidth
        title=""
        rightSizeBtn="ok"
        showLeftBtn={false}
        handRightClick={handleConfirm}
      >
        <Box
          sx={{
            height: '200px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Box>
            <Box
              sx={{
                mb: '10px',
              }}
            >
              {b3Lang('payment.firstLoginToPay')}
            </Box>
            <Box>{b3Lang('payment.clickToLandingPage')}</Box>
          </Box>
        </Box>
      </B3Dialog>
    </Box>
  );
}

export default Payment;
