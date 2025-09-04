import { useContext, useEffect, useState } from 'react';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

import { B3ProductList } from '@/components';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { snackbar } from '@/utils';
import { getFileNameFromResponseHeader } from '@/utils/getFileNameFromResponseHeader';
import { handleBlobDownload } from '@/utils/handleBlobDownload';

import { OrderBillings, OrderProductItem, ProductItem } from '../../../types';
import { OrderDetailsContext } from '../context/OrderDetailsContext';

import DownloadDigitalProductsDialog from './DownloadDigitalProductsDialog';
import { getDigitalDownloadElements } from './getDigitalDownloadElements';

type OrderBillingProps = {
  isCurrentCompany: boolean;
};

export default function OrderBilling({ isCurrentCompany }: OrderBillingProps) {
  const {
    state: { billings = [], addressLabelPermission, orderId, money },
  } = useContext(OrderDetailsContext);

  const [isMobile] = useMobile();

  const b3Lang = useB3Lang();

  const [isDigitalDownloadOpen, setIsDigitalDownloadOpen] = useState(false);
  const [digitalProducts, setDigitalProducts] = useState<OrderProductItem[]>([]);
  const [currentDigitalProduct, setCurrentDigitalProduct] = useState<ProductItem | undefined>(
    undefined,
  );

  useEffect(() => {
    const getDigitalProductsInformation = async (id: number | string) => {
      const elements = await getDigitalDownloadElements(id);

      if (!elements.length) {
        return;
      }

      const digitalProductsData = elements.map((item) => item.node);

      const digitalProducts = billings[0].digitalProducts.map((product: OrderProductItem) => {
        const fileUrls =
          digitalProductsData.find(({ productEntityId }) => productEntityId === product.product_id)
            ?.downloadFileUrls || [];

        return {
          ...product,
          downloadFileUrls: fileUrls,
        };
      });

      setDigitalProducts(digitalProducts);
    };

    if (orderId) {
      getDigitalProductsInformation(orderId);
    }
  }, [billings, orderId]);

  const getCurrentDigitalProduct = (productId: number | undefined) => {
    const current = digitalProducts.find((product) => product.product_id === productId);
    setCurrentDigitalProduct(current);
    setIsDigitalDownloadOpen(!isDigitalDownloadOpen);
  };

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

  const handleDownloadDigitalFile = async (fileUrl: string) => {
    try {
      const res = await fetch(fileUrl);
      const blob = await res.blob();
      if (blob.type === 'text/html') {
        throw new Error();
      }
      const filename = getFileNameFromResponseHeader(res.headers);
      handleBlobDownload(blob, filename);
    } catch {
      snackbar.error(b3Lang('orderDetail.digitalProducts.fileNotAvailable'));
    }
  };

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
              products={digitalProducts.length ? digitalProducts : billingItem.digitalProducts}
              totalText="Total"
              canToProduct={isCurrentCompany}
              textAlign={isMobile ? 'left' : 'right'}
              money={money}
              getDigitalDownloadLinks={getCurrentDigitalProduct}
            />
          </CardContent>
          <DownloadDigitalProductsDialog
            isOpen={isDigitalDownloadOpen}
            onClose={() => setIsDigitalDownloadOpen(false)}
            product={currentDigitalProduct}
            b3Lang={b3Lang}
            handleDownloadDigitalFile={handleDownloadDigitalFile}
          />
        </Card>
      ))}
    </Stack>
  );
}
