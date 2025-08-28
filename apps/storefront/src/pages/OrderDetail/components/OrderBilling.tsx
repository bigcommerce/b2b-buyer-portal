import { Box, Card, CardContent, Stack, Typography } from '@mui/material';
import { useContext } from 'react';

import { B3ProductList } from '@/components';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';

import { OrderBillings } from '../../../types';
import { OrderDetailsContext } from '../context/OrderDetailsContext';

type OrderBillingProps = {
  isCurrentCompany: boolean;
};

export default function OrderBilling({ isCurrentCompany }: OrderBillingProps) {
  const {
    state: { billings = [], addressLabelPermission, orderId, money },
  } = useContext(OrderDetailsContext);

  const [isMobile] = useMobile();

  const b3Lang = useB3Lang();

  const getFullName = (billing: OrderBillings) => {
    const { billingAddress } = billing;

    if (billingAddress) {
      const { first_name: firstName, last_name: lastName } = billingAddress;

      return `${firstName} ${lastName}`;
    }

    return '';
  };

  const getFullAddress = (billing: OrderBillings) => {
    const { billingAddress } = billing;

    if (billingAddress) {
      const { street_1: street1, city, state, zip, country } = billingAddress;

      return `${street1}, ${city}, ${state} ${zip}, ${country}`;
    }

    return '';
  };

  const getCompanyName = (company: string) => {
    if (addressLabelPermission) {
      return company;
    }

    const index = company.indexOf('/');

    return company.substring(index + 1, company.length);
  };

  const hasDigitalProducts = billings.some((billing) => billing.digitalProducts.length > 0);

  if (!hasDigitalProducts) {
    return null;
  }

  return (
    <Stack spacing={2}>
      {billings.map((billingItem: OrderBillings) => (
        <Card key={`billing-${orderId}`}>
          <CardContent>
            <Box
              sx={{
                wordBreak: 'break-word',
                color: 'rgba(0, 0, 0, 0.87)',
              }}
            >
              <Typography
                sx={{
                  fontSize: '24px',
                  fontWeight: '400',
                }}
                variant="h6"
              >
                {getFullName(billingItem)}
                {' – '}
                {getCompanyName(billingItem.billingAddress.company || '')}
              </Typography>
              <Typography
                sx={{
                  fontSize: '24px',
                  fontWeight: '400',
                }}
                variant="h6"
              >
                {getFullAddress(billingItem)}
              </Typography>
            </Box>

            <Box
              sx={{
                margin: '20px 0 2px',
              }}
            >
              <Typography sx={{ fontWeight: 'bold', color: '#313440' }} variant="body1">
                {b3Lang('orderDetail.billing.digitalProducts')}
              </Typography>
            </Box>

            <B3ProductList
              canToProduct={isCurrentCompany}
              money={money}
              products={billingItem.digitalProducts}
              textAlign={isMobile ? 'left' : 'right'}
              totalText="Total"
            />
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
