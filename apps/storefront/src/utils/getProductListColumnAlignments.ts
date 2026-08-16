type ProductListTextAlign = 'left' | 'right';
type ProductListFlexAlign = 'flex-start' | 'flex-end';

interface ProductListColumnAlignments {
  qtyTextAlign: ProductListTextAlign;
  numericTextAlign: ProductListTextAlign;
  qtyStackItemsAlignment: ProductListFlexAlign;
  numericStackItemsAlignment: ProductListFlexAlign;
}

/** Qty is left-aligned; Price/Total stay right-aligned on desktop to match product tables. */
export function getProductListColumnAlignments(isMobile: boolean): ProductListColumnAlignments {
  const numericTextAlign: ProductListTextAlign = isMobile ? 'left' : 'right';

  return {
    qtyTextAlign: 'left',
    numericTextAlign,
    qtyStackItemsAlignment: 'flex-start',
    numericStackItemsAlignment: numericTextAlign === 'right' ? 'flex-end' : 'flex-start',
  };
}
