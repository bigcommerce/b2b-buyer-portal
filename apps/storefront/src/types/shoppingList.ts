export interface ShoppingListItem {
  customerInfo: {
    firstName: string,
    lastName: string,
    userId: string,
    email: string,
  }
  description: string,
  grandTotal: string,
  id: string,
  isOwner: boolean,
  isShowGrandTotal: boolean,
  name: string,
  status: number,
  totalDiscount: string,
  totalTax: string,
}
