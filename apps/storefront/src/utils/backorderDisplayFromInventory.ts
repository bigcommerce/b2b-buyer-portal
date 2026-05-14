export interface BackorderDisplayFields {
  totalOnHand: number;
  quantityBackordered: number;
  backorderMessage?: string;
}

export function getBackorderDisplayFieldsFromOnHand(
  orderedQuantity: number,
  totalOnHand: number,
  backorderMessage?: string,
): BackorderDisplayFields | null {
  const quantityBackordered = Math.max(0, orderedQuantity - totalOnHand);
  if (quantityBackordered <= 0) return null;

  return {
    totalOnHand,
    quantityBackordered,
    backorderMessage,
  };
}
