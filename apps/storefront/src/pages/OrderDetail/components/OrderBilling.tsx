import { useContext, useEffect, useState } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

import { B3ProductList } from '@/components';
import { useMobile } from '@/hooks/useMobile';
import { useB3Lang } from '@/lib/lang';

import { Address, OrderProductItem } from '../../../types';
import { OrderDetailsContext } from '../context/OrderDetailsContext';

import DownloadDigitalProductsDialog from './DownloadDigitalProductsDialog/DownloadDigitalProductsDialog';
import { getDigitalDownloadElements } from './getDigitalDownloadElements';

type OrderBillingProps = {
  isCurrentCompany: boolean;
};

export function OrderBilling({ isCurrentCompany }: OrderBillingProps) {
  const {
    state: { billingAddress, digitalProducts = [], addressLabelPermission, orderId, money },
  } = useContext(OrderDetailsContext);

  const [isMobile] = useMobile();

  const b3Lang = useB3Lang();

  const [digitalProductsWithUrl, setDigitalProductsWithUrl] = useState<OrderProductItem[]>([]);
  const [currentDigitalProduct, setCurrentDigitalProduct] = useState<OrderProductItem>();

  useEffect(() => {
    const getDigitalProductsInformation = async (id: number | string) => {
      const elements = await getDigitalDownloadElements(id);

      if (!elements.length) {
        return;
      }

      const digitalProductsData = elements.map((item) => item.node);

      const digitalProductsUrls = digitalProducts.map((product: OrderProductItem) => {
        const fileUrls =
          digitalProductsData.find(({ productEntityId }) => productEntityId === product.product_id)
            ?.downloadFileUrls || [];

        return {
          ...product,
          downloadFileUrls: fileUrls,
        };
      });

      setDigitalProductsWithUrl(digitalProductsUrls);
    };

    if (orderId) {
      getDigitalProductsInformation(orderId);
    }
  }, [digitalProducts, orderId]);

  const getCurrentProductUrls = (productId: number | undefined) => {
    const currentProduct = digitalProductsWithUrl?.find(
      (product) => product.product_id === productId,
    );
    setCurrentDigitalProduct(currentProduct);
  };

  const getFullName = (billingAddress: Address) => {
    if (billingAddress) {
      const { first_name: firstName, last_name: lastName } = billingAddress;

      return `${firstName} ${lastName}`;
    }

    return '';
  };

  const getFullAddress = (billingAddress: Address) => {
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

  if (!billingAddress) {
    return null;
  }

  return (
    <Stack spacing={2}>
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
              {getFullName(billingAddress)}
              {' – '}
              {getCompanyName(billingAddress.company || '')}
            </Typography>
            <Typography
              variant="h6"
              sx={{
                fontSize: '24px',
                fontWeight: '400',
              }}
            >
              {getFullAddress(billingAddress)}
            </Typography>
          </Box>

          <Box
            sx={{
              margin: '20px 0 2px',
            }}
          >
            <Typography variant="body1" sx={{ fontWeight: 'bold', color: '#313440' }}>
              {b3Lang('orderDetail.billing.digitalProducts')}
            </Typography>
          </Box>

          <B3ProductList
            products={
              digitalProductsWithUrl.length ? digitalProductsWithUrl : digitalProducts || []
            }
            totalText="Total"
            canToProduct={isCurrentCompany}
            textAlign={isMobile ? 'left' : 'right'}
            money={money}
            getCurrentProductUrls={getCurrentProductUrls}
          />
        </CardContent>
        <DownloadDigitalProductsDialog
          isOpen={!!currentDigitalProduct}
          onClose={() => setCurrentDigitalProduct(undefined)}
          product={currentDigitalProduct}
        />
      </Card>
    </Stack>
  );
}
