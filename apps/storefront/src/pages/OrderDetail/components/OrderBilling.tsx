import { useCallback, useContext, useEffect, useState } from 'react';
import { InsertDriveFileOutlined } from '@mui/icons-material';
import { Box, Card, CardContent, Stack, Typography } from '@mui/material';

import { B3ProductList } from '@/components';
import B3Dialog from '@/components/B3Dialog';
import CustomButton from '@/components/button/CustomButton';
import { useMobile } from '@/hooks';
import { useB3Lang } from '@/lib/lang';
import { getDigitalDownloadElements } from '@/shared/service/b2b/graphql/orders';
import { snackbar } from '@/utils';
import { getBlobFileName } from '@/utils/getBlobFileName';
import { handleBlobDownload } from '@/utils/handleBlobDownload';

import { OrderBillings, OrderProductItem, ProductItem } from '../../../types';
import { OrderDetailsContext } from '../context/OrderDetailsContext';

type OrderBillingProps = {
  isCurrentCompany: boolean;
};

type DigitalProductNode = {
  downloadFileUrls: string[];
  downloadPageUrl: string;
  name: string;
  productEntityId: number;
};

type DigitalProduct = {
  node: DigitalProductNode;
};

export default function OrderBilling({ isCurrentCompany }: OrderBillingProps) {
  const {
    state: { billings = [], addressLabelPermission, orderId, money },
  } = useContext(OrderDetailsContext);

  const [isMobile] = useMobile();

  const b3Lang = useB3Lang();

  const [isDigitalDownloadOpen, setIsDigitalDownloadOpen] = useState(false);
  const [isDigitalProductLoading, setIsDigitalProductLoading] = useState(false);
  const [digitalProducts, setDigitalProducts] = useState<OrderProductItem[]>([]);
  const [currentDigitalProduct, setCurrentDigitalProduct] = useState<ProductItem | undefined>(
    undefined,
  );

  const getDigitalProductsInformation = useCallback(async () => {
    setIsDigitalProductLoading(true);
    let elements = [];
    try {
      elements = orderId ? await getDigitalDownloadElements(orderId) : [];
    } catch {
      throw Error('Failed to fetch digital products');
    } finally {
      setIsDigitalProductLoading(false);
    }

    const digitalProductsData =
      elements.length > 0 ? elements?.map((item: DigitalProduct) => item.node) : null;

    const digitalProducts = billings[0].digitalProducts.map((product: OrderProductItem) => {
      const fileUrls =
        digitalProductsData?.find(
          (item: DigitalProductNode) => item.productEntityId === product.product_id,
        )?.downloadFileUrls || [];

      return {
        ...product,
        downloadFileUrls: fileUrls,
      };
    });

    setDigitalProducts(digitalProducts);
  }, [billings, orderId]);

  useEffect(() => {
    if (orderId) {
      getDigitalProductsInformation();
    }
  }, [orderId, getDigitalProductsInformation]);

  const getCurrentDigitalProduct = (productId: number) => {
    const current = digitalProducts.find(
      (product: ProductItem) => product.product_id === productId,
    );
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
    let blob;
    try {
      const res = await fetch(fileUrl);
      blob = await res.blob();
      const filename = getBlobFileName(blob, res.headers);
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
          <B3Dialog
            isOpen={isDigitalDownloadOpen}
            fullWidth
            handleLeftClick={() => setIsDigitalDownloadOpen(false)}
            title={b3Lang('orderDetail.digitalProducts.filesToDownload')}
            rightSizeBtn={undefined}
            leftSizeBtn={b3Lang('orderDetail.digitalProducts.close')}
            maxWidth="md"
            loading={isDigitalProductLoading}
            showRightBtn={false}
          >
            {currentDigitalProduct?.downloadFileUrls?.map((fileUrl: string, index: number) => (
              <Box
                key={currentDigitalProduct.id + index}
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '8px 0',
                  margin: '15px 0 15px 0',
                  border: '1px solid #1976D2',
                  borderRadius: '10px',
                  p: 2,
                }}
              >
                <Box sx={{ display: 'flex' }}>
                  <InsertDriveFileOutlined
                    sx={{
                      color: '#1976D2',
                      fontSize: '40px',
                    }}
                  />
                  <Typography
                    sx={{
                      color: '#1976D2',
                      fontSize: '14px',
                      alignSelf: 'center',
                    }}
                  >
                    {`${currentDigitalProduct?.name} ${index + 1}`}
                  </Typography>
                </Box>
                <CustomButton
                  onClick={() => handleDownloadDigitalFile(fileUrl)}
                  sx={{
                    color: '#1976D2',
                    textDecoration: 'none',
                    fontSize: '14px',
                  }}
                >
                  {b3Lang('orderDetail.digitalProducts.download')}
                </CustomButton>
              </Box>
            ))}
          </B3Dialog>
        </Card>
      ))}
    </Stack>
  );
}
