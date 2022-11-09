export interface OrderProductOption {
  [k: string]: any
}
export interface OrderProductItem {
  [k: string]: any
}

export interface OrderShipmentProductItem {
  [k: string]: any
}

export interface OrderShipmentItem {
  [k: string]: any
}

export interface OrderShippedItem extends OrderShipmentItem {
  itemsInfo: OrderProductItem[],
  [k: string]: any
}

export interface OrderShippingAddressItem {
  [k: string]: any
}

export interface OrderHistoryItem{
  [k: string]: any
}

export interface B2BOrderData {
  [k: string]: any
}

const getOrderShipping = (data: B2BOrderData) => {
  const {
    shipments,
    shippingAddress = [],
    products = [],
  } = data

  const shipmentsInfo = shipments || []
  const shippedItems = shipmentsInfo.map((shipment: OrderShipmentItem) => {
    const {
      items,
    } = shipment

    const itemsInfo: OrderProductItem[] = []
    items.forEach((item: OrderShipmentProductItem) => {
      const product = products.find((product: OrderProductItem) => product.id === item.order_product_id)
      if (product) {
        itemsInfo.push({
          ...product,
          current_quantity_shipped: item.quantity,
        })
      }
    })

    return {
      ...shipment,
      itemsInfo,
    }
  })

  const shippings = shippingAddress.map((address: OrderShippingAddressItem) => {
    const notShipItem: OrderShippedItem = {
      isNotShip: true,
      itemsInfo: products.filter((product: OrderProductItem) => product.quantity > product.quantity_shipped && address.id === product.order_address_id),
    }

    return {
      ...address,
      shipmentItems: [
        ...(shippedItems.filter((shippedItem: OrderShippedItem) => shippedItem.order_address_id === address.id)),
        notShipItem,
      ],
    }
  })

  return shippings
}

const getOrderSummary = (data: B2BOrderData) => {
  const {
    dateCreated,
    firstName,
    lastName,
    totalTax,
    subtotalExTax,
    subtotalIncTax,
    totalExTax,
    totalIncTax,
    handlingCostExTax,
    handlingCostIncTax,
    shippingCostExTax,
    shippingCostIncTax,
  } = data

  const formatPrice = (price: string | number) => {
    try {
      const priceNumer = parseFloat(price.toString()) || 0
      return priceNumer.toFixed(2)
    } catch (error) {
      return '0.00'
    }
  }

  const orderSummary = {
    createAt: dateCreated,
    name: `${firstName} ${lastName}`,
    priceData: {
      'Sub total': formatPrice(subtotalExTax || subtotalIncTax || ''),
      Shipping: formatPrice(shippingCostExTax || shippingCostIncTax || ''),
      'Handing fee': formatPrice(handlingCostExTax || handlingCostIncTax || ''),
      Tax: formatPrice(totalTax || ''),
      'Grand total': formatPrice(totalExTax || totalIncTax || ''),
    },
  }

  return orderSummary
}

const getPaymentData = (data: B2BOrderData) => {
  const {
    updatedAt,
    billingAddress,
    paymentMethod,
  } = data

  return {
    updatedAt,
    billingAddress,
    paymentMethod,
  }
}

export const convertB2BOrderDetails = (data: B2BOrderData) => ({
  shippings: getOrderShipping(data),
  history: data.orderHistoryEvent || [],
  poNumber: data.poNumber || '',
  status: data.status,
  statusCode: data.statusId,
  currencyCode: data.currencyCode,
  currency: data.money?.currency_token || '$',
  money: data.money,
  orderSummary: getOrderSummary(data),
  payment: getPaymentData(data),
  orderComments: data.customerMessage,
  products: data.products,
  orderId: +data.id,
})
