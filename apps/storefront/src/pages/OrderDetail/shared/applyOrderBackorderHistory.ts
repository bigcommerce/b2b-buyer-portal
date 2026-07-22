import { OrderBackorderHistory } from '@/shared/service/bc/graphql/orders';
import { OrderProductItem } from '@/types';

import convertB2BOrderDetails from './B2BOrderData';
import { getRemainingBackorderedQuantity } from './getRemainingBackorderedQuantity';

type ConvertedOrderData = ReturnType<typeof convertB2BOrderDetails>;

function applyToProduct(
  product: OrderProductItem,
  byEntityId: Map<number, OrderBackorderHistory['lineItems'][number]>,
): OrderProductItem {
  const match = byEntityId.get(product.id);
  if (!match) {
    return product;
  }

  return {
    ...product,
    quantityBackordered: match.quantityBackordered,
    backorderMessage: match.backorderMessage,
  };
}

export function applyOrderBackorderHistory(
  data: ConvertedOrderData,
  history: OrderBackorderHistory | null,
): ConvertedOrderData & { shippingExpectationMessage?: string } {
  if (!history || history.lineItems.length === 0) {
    // Explicit undefined (not simply omitting the key) so the context reducer's shallow merge
    // clears a stale message left over from a previously viewed order with backorders.
    return { ...data, shippingExpectationMessage: undefined };
  }

  const byEntityId = new Map(history.lineItems.map((item) => [item.entityId, item]));

  const shippings = data.shippings.map((shipping) => ({
    ...shipping,
    shipmentItems: shipping.shipmentItems.map((shipment) => ({
      ...shipment,
      itemsInfo: shipment.itemsInfo.map((product) => applyToProduct(product, byEntityId)),
    })),
    notShip: {
      itemsInfo: shipping.notShip.itemsInfo.map((product) => applyToProduct(product, byEntityId)),
    },
  }));

  // The order-level message is only relevant while something is still actually outstanding —
  // a line's raw history figure doesn't shrink as it ships, so re-check what's left.
  const hasRemainingBackorder = shippings.some((shipping) =>
    shipping.notShip.itemsInfo.some((product) => getRemainingBackorderedQuantity(product) > 0),
  );

  return {
    ...data,
    products: data.products.map((product) => applyToProduct(product, byEntityId)),
    digitalProducts: data.digitalProducts.map((product) => applyToProduct(product, byEntityId)),
    shippings,
    shippingExpectationMessage: hasRemainingBackorder
      ? (history.shippingExpectationMessage ?? undefined)
      : undefined,
  };
}
