import { Fragment, useContext, useEffect, useState } from 'react';
import { useB3Lang } from '@b3/lang';
import styled from '@emotion/styled';
import { Box, Card, CardContent, Link, Stack, Typography } from '@mui/material';
import format from 'date-fns/format';
import { getTracking } from 'ts-tracking-number';

import { B3ProductList } from '@/components';
import { useMobile } from '@/hooks';

import { OrderProductItem, OrderShippedItem, OrderShippingsItem } from '../../../types';
import { OrderDetailsContext } from '../context/OrderDetailsContext';

const ShipmentTitle = styled('span')(() => ({
  fontWeight: 'bold',
  color: '#313440',
}));

export default function OrderShipping() {
  const {
    state: { shippings = [], addressLabelPermission, orderIsDigital, money, variantImages = [] },
  } = useContext(OrderDetailsContext);

  const [isMobile] = useMobile();

  const b3Lang = useB3Lang();

  const [shippingsDetail, setShippingsDetail] = useState<OrderShippingsItem[]>([]);

  useEffect(() => {
    if (shippings.length) {
      shippings.forEach((list: OrderShippingsItem) => {
        const {
          shipmentItems,
          notShip: { itemsInfo: notShipItemsInfo = [] },
        } = list;

        if (variantImages.length > 0 && notShipItemsInfo.length > 0) {
          const newNotShipItemsInfo = notShipItemsInfo.map((productItem: OrderProductItem) => {
            const currentVariant = variantImages.find(
              (variant) =>
                productItem.sku === variant?.variantSku ||
                +productItem.variant_id === +variant.variantId,
            );

            return {
              ...productItem,
              imageUrl: currentVariant?.variantImage || productItem.imageUrl,
            };
          });

          list.notShip.itemsInfo = newNotShipItemsInfo;
        }
        if (shipmentItems.length) {
          shipmentItems.forEach((item: OrderShippedItem) => {
            const { itemsInfo } = item;
            if (variantImages.length > 0) {
              const newItemsInfo = itemsInfo.map((productItem: OrderProductItem) => {
                const currentVariant = variantImages.find(
                  (variant) =>
                    productItem.sku === variant?.variantSku ||
                    +productItem.variant_id === +variant.variantId,
                );
                return {
                  ...productItem,
                  imageUrl: currentVariant?.variantImage || productItem.imageUrl,
                };
              });
              item.itemsInfo = newItemsInfo;
            }

            const trackingNumber = item.tracking_number;
            if (item?.generated_tracking_link && trackingNumber) {
              item.tracking_link = item.generated_tracking_link;
              return;
            }

            const tracking = getTracking(trackingNumber);
            if (tracking) {
              const { trackingUrl = '', trackingNumber } = tracking;
              const shippingItem = item;
              if (trackingUrl) {
                shippingItem.tracking_link = trackingUrl.includes('=%s')
                  ? trackingUrl.replace('=%s', `=${trackingNumber}`)
                  : trackingUrl;
              }
            }
          });
        }
      });
      setShippingsDetail([...shippings]);
    }
  }, [shippings, variantImages]);

  const getFullName = (shipping: OrderShippingsItem) => {
    const { first_name: firstName, last_name: lastName } = shipping;

    return `${firstName} ${lastName}`;
  };

  const getFullAddress = (shipping: OrderShippingsItem) => {
    const { street_1: street1, city, state, zip, country } = shipping;

    return `${street1}, ${city}, ${state} ${zip}, ${country}`;
  };

  let shipmentIndex = 0;
  const getShipmentIndex = () => {
    shipmentIndex += 1;
    return shipmentIndex;
  };

  const getShipmentText = (shipment: OrderShippedItem) => {
    const {
      date_created: createdDate,
      shipping_method: shippingMethod,
      shipping_provider: shippingProvider,
    } = shipment;

    const time = format(new Date(createdDate), 'LLLL, d');

    return `shipped on ${time}, by ${shippingProvider}, ${shippingMethod}`;
  };

  const getCompanyName = (company: string) => {
    if (addressLabelPermission) {
      return company;
    }

    const index = company.indexOf('/');

    return company.substring(index + 1, company.length);
  };

  return orderIsDigital ? null : (
    <Stack spacing={2}>
      {shippingsDetail.map((shipping: OrderShippingsItem) => (
        <Card key={`shipping-${shipping.id}`}>
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
                {getFullName(shipping)}
                {' – '}
                {getCompanyName(shipping.company || '')}
              </Typography>
              <Typography
                variant="h6"
                sx={{
                  fontSize: '24px',
                  fontWeight: '400',
                }}
              >
                {getFullAddress(shipping)}
              </Typography>
            </Box>

            {(shipping.shipmentItems || []).map((shipment: OrderShippedItem) =>
              shipment.itemsInfo.length > 0 ? (
                <Fragment key={`shipment-${shipment.id}`}>
                  <Box
                    sx={{
                      margin: '20px 0 2px',
                    }}
                  >
                    <Typography variant="body1">
                      <>
                        <ShipmentTitle>{`${b3Lang(
                          'orderDetail.shipment.shipment',
                        )} ${getShipmentIndex()} – `}</ShipmentTitle>
                        {getShipmentText(shipment)}
                      </>
                    </Typography>
                    {shipment.tracking_link ? (
                      <Link href={shipment.tracking_link} target="_blank">
                        {shipment.tracking_number}
                      </Link>
                    ) : (
                      <Typography variant="body1">{shipment.tracking_number}</Typography>
                    )}
                  </Box>
                  <B3ProductList
                    quantityKey="current_quantity_shipped"
                    products={shipment.itemsInfo}
                    money={money}
                    totalText="Total"
                    canToProduct
                    textAlign="right"
                  />
                </Fragment>
              ) : null,
            )}

            {shipping.notShip.itemsInfo.length > 0 ? (
              <Fragment key={`shipment-notShip-${shipping.id}`}>
                <Box
                  sx={{
                    margin: '20px 0 2px',
                  }}
                >
                  <Typography variant="body1">
                    <ShipmentTitle>{b3Lang('orderDetail.shipment.notShippedYet')}</ShipmentTitle>
                  </Typography>
                </Box>

                <B3ProductList
                  quantityKey="not_shipping_number"
                  products={shipping.notShip.itemsInfo}
                  money={money}
                  totalText="Total"
                  canToProduct
                  textAlign={isMobile ? 'left' : 'right'}
                />
              </Fragment>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </Stack>
  );
}
