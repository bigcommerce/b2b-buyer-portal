import {
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
  Link,
} from '@mui/material'

import styled from '@emotion/styled'

import {
  format,
} from 'date-fns'

import {
  OrderShippingAddressItem,
  OrderShippedItem,
  OrderProductItem,
} from '../shared/B2BOrderData'

import {
  OrderProduct,
} from './OrderProduct'

interface Shipping extends OrderShippingAddressItem{
  shipmentItems: OrderShippedItem[]
}
interface OrderShippingProps {
  shippings: Shipping[]
}

const ShipmentTitle = styled('span')(() => ({
  fontWeight: 'bold',
}))

export const OrderShipping = (props: OrderShippingProps) => {
  const {
    shippings,
  } = props

  const getFullName = (shipping: Shipping) => {
    const {
      first_name: firstName,
      last_name: lastName,
    } = shipping

    return `${firstName} ${lastName}`
  }

  const getFullAddress = (shipping: Shipping) => {
    const {
      street_1: street1,
      city,
      state,
      zip,
      country,
    } = shipping

    return `${street1}, ${city}, ${state} ${zip}, ${country}`
  }

  let shipmentIndex = 0
  const getShipmentIndex = () => {
    shipmentIndex += 1
    return shipmentIndex
  }

  const getShipmentText = (shipment: OrderShippedItem) => {
    const {
      date_created: createdDate,
      shipping_provider: shippingProvider,
      shipping_method: shippingMethod,
    } = shipment

    const time = format(new Date(createdDate), 'LLLL, d')

    return `shipped on ${time}, by ${shippingProvider}, ${shippingMethod}`
  }

  const getShippingProductQuantity = (item: OrderProductItem) => item.current_quantity_shipped

  const getNotShippingProductQuantity = (item: OrderProductItem) => {
    const notShipNumber = item.quantity - item.quantity_shipped

    return notShipNumber > 0 ? notShipNumber : 0
  }

  return (
    <Stack spacing={2}>
      {
        shippings.map((shipping: Shipping) => (
          <Card>
            <CardContent>
              <Box sx={{
                wordBreak: 'break-word',
              }}
              >
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '1.125rem',
                  }}
                >
                  {getFullName(shipping)}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    fontSize: '1.125rem',
                  }}
                >
                  {getFullAddress(shipping)}
                </Typography>
              </Box>

              {
                (shipping.shipmentItems || []).map((shipment: OrderShippedItem) => (
                  <>
                    {
                      shipment.isNotShip && (
                        <Box sx={{
                          margin: '20px 0 2px',
                        }}
                        >
                          <Typography variant="body1">
                            <ShipmentTitle>Not Shipped yet</ShipmentTitle>
                          </Typography>
                        </Box>
                      )
                    }
                    {
                      !shipment.isNotShip && (
                        <Box sx={{
                          margin: '20px 0 2px',
                        }}
                        >
                          <Typography variant="body1">
                            <>
                              <ShipmentTitle>{`Shipment ${getShipmentIndex()} - `}</ShipmentTitle>
                              {getShipmentText(shipment)}
                            </>
                          </Typography>
                          {
                            shipment.tracking_link
                              ? (
                                <Link
                                  href={shipment.tracking_link}
                                  target="_blank"
                                >
                                  {shipment.tracking_number}
                                </Link>
                              )
                              : (
                                <Typography variant="body1">
                                  {shipment.tracking_number}
                                </Typography>
                              )
                          }
                        </Box>
                      )
                    }
                    <OrderProduct
                      getProductQuantity={shipment.isNotShip ? getNotShippingProductQuantity : getShippingProductQuantity}
                      products={shipment.itemsInfo}
                    />
                  </>
                ))
              }

            </CardContent>
          </Card>
        ))
      }
    </Stack>
  )
}
