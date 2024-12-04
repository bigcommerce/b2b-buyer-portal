import { useContext } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

import { B3ProductList } from '@/components';
import { useMobile } from '@/hooks';

import { OrderBillings } from '../../../types';
import { OrderDetailsContext } from '../context/OrderDetailsContext';

type OrderBillingProps = {
  isCurrentCompany: boolean;
};

export default function OrderBilling({ isCurrentCompany }: OrderBillingProps) {
  const {
    state: { billings = [], addressLabelPermission, orderId, orderIsDigital },
  } = useContext(OrderDetailsContext);

  const [isMobile] = useMobile();

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

  return orderIsDigital ? (
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
                variant="h6"
                sx={{
                  fontSize: '24px',
                  fontWeight: '400',
                }}
              >
                {getFullName(billingItem)}
                {' – '}
                {getCompanyName(billingItem.billingAddress.company || '')}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '24px',
                  fontWeight: '400',
                }}
              >
                {getFullAddress(billingItem)}
              </Typography>
            </Box>

            <B3ProductList
              products={billingItem.products}
              totalText="Total"
              canToProduct={isCurrentCompany}
              textAlign={isMobile ? 'left' : 'right'}
            />
          </CardContent>
        </Card>
      ))}
    </Stack>
  ) : null;
}
