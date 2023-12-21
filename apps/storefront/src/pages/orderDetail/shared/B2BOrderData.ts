import { LangFormatFunction } from '@b3/lang'

import { getActiveCurrencyInfo } from '@/utils'

import {
  B2BOrderData,
  OrderBillings,
  OrderProductItem,
  OrderShipmentItem,
  OrderShipmentProductItem,
  OrderShippedItem,
  OrderShippingAddressItem,
  OrderShippingsItem,
  OrderSummary,
} from '../../../types'

const { decimal_places: decimalPlaces = 2 } = getActiveCurrencyInfo()

const getOrderShipping = (data: B2BOrderData) => {
  const { shipments, shippingAddress = [], products = [] } = data

  const shipmentsInfo = shipments || []
  const shippedItems = shipmentsInfo.map((shipment: OrderShipmentItem) => {
    const { items } = shipment

    const itemsInfo: OrderProductItem[] = []
    items.forEach((item: OrderShipmentProductItem) => {
      const product = products.find(
        (product: OrderProductItem) => product.id === item.order_product_id
      )
      if (product) {
        itemsInfo.push({
          ...product,
          current_quantity_shipped: item.quantity,
          not_shipping_number: product.quantity - product.quantity_shipped,
        })
      }
    })

    return {
      ...shipment,
      itemsInfo,
    }
  })

  const shippings: OrderShippingsItem[] = shippingAddress.map(
    (address: OrderShippingAddressItem) => ({
      ...address,
      shipmentItems: [
        ...shippedItems.filter(
          (shippedItem: OrderShippedItem) =>
            shippedItem.order_address_id === address.id
        ),
      ],
      notShip: {
        itemsInfo: products.filter((product: OrderProductItem) => {
          product.not_shipping_number =
            product.quantity - product.quantity_shipped
          return (
            product.quantity > product.quantity_shipped &&
            address.id === product.order_address_id
          )
        }),
      },
    })
  )

  return shippings
}

const getOrderBilling = (data: B2BOrderData) => {
  const { billingAddress, products } = data

  const billings: OrderBillings[] = [
    {
      billingAddress,
      products,
    },
  ]

  return billings
}

const formatPrice = (price: string | number) => {
  try {
    const priceNumer = parseFloat(price.toString()) || 0
    return priceNumer.toFixed(decimalPlaces)
  } catch (error) {
    return '0.00'
  }
}

const getOrderSummary = (data: B2BOrderData, b3Lang: LangFormatFunction) => {
  const {
    dateCreated,
    firstName,
    lastName,
    totalTax,
    subtotalExTax,
    totalExTax,
    totalIncTax,
    handlingCostExTax,
    handlingCostIncTax,
    shippingCostExTax,
  } = data

  const labels = {
    subTotal: b3Lang('orderDetail.summary.subTotal'),
    shipping: b3Lang('orderDetail.summary.shipping'),
    handingFee: b3Lang('orderDetail.summary.handingFee'),
    tax: b3Lang('orderDetail.summary.tax'),
    grandTotal: b3Lang('orderDetail.summary.grandTotal'),
  }

  const orderSummary: OrderSummary = {
    createAt: dateCreated,
    name: `${firstName} ${lastName}`,
    priceData: {
      [labels.subTotal]: formatPrice(subtotalExTax || ''),
      [labels.shipping]: formatPrice(shippingCostExTax || ''),
      [labels.handingFee]: formatPrice(
        handlingCostIncTax || handlingCostExTax || ''
      ),
      [labels.tax]: formatPrice(totalTax || ''),
      [labels.grandTotal]: formatPrice(totalIncTax || totalExTax || ''),
    },
  }

  return orderSummary
}

const getPaymentData = (data: B2BOrderData) => {
  const { updatedAt, billingAddress, paymentMethod } = data

  return {
    updatedAt,
    billingAddress,
    paymentMethod,
  }
}

const handleProductQuantity = (data: B2BOrderData) => {
  const { products } = data

  const newProducts: OrderProductItem[] = []

  products.forEach((product: OrderProductItem) => {
    const productIndex = newProducts.findIndex(
      (item) => +item.variant_id === +product.variant_id
    )

    if (productIndex === -1) {
      newProducts.push(product)
    } else {
      const existedProduct = newProducts[productIndex]

      newProducts[productIndex] = {
        ...existedProduct,
        quantity: +existedProduct.quantity + +product.quantity,
      }
    }
  })

  return newProducts
}

const convertB2BOrderDetails = (
  data: B2BOrderData,
  b3Lang: LangFormatFunction
) => ({
  shippings: data.orderIsDigital ? [] : getOrderShipping(data),
  billings: data.orderIsDigital ? getOrderBilling(data) : [],
  history: data.orderHistoryEvent || [],
  poNumber: data.poNumber || '',
  status: data.status,
  statusCode: data.statusId,
  currencyCode: data.currencyCode,
  currency: data.money?.currency_token || '$',
  money: data.money,
  orderSummary: getOrderSummary(data, b3Lang),
  payment: getPaymentData(data),
  orderComments: data.customerMessage,
  products: handleProductQuantity(data),
  orderId: +data.id,
  customStatus: data.customStatus,
  ipStatus: +data.ipStatus || 0, // 0: no invoice, 1,2: have invoice
  invoiceId: +(data.invoiceId || 0),
  canReturn: data.canReturn,
  createdEmail: data.createdEmail,
  orderIsDigital: data.orderIsDigital,
})

export default convertB2BOrderDetails
