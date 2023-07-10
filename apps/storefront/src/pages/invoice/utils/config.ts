// NORMAL:   ;  DETAIL:  ; CHECKOUT:  ;
const InvoiceListType = {
  NORMAL: 'normal',
  DETAIL: 'detail',
  CHECKOUT: 'checkout',
}

// invoice status
// (0, "open"), (1, "partial paid"), (2, "Paid")
export const invoiceStatus = [
  {
    key: 'open',
    value: 0,
    label: 'Open',
  },
  {
    key: 'partialPaid',
    value: 1,
    label: 'Partially paid',
  },
  {
    key: 'paid',
    value: 2,
    label: 'Paid',
  },
  {
    key: 'overdue',
    value: 3,
    label: 'Overdue',
  },
]
// (3, "Overdue")-【Display status when invoice exceeds due date. For front-end display only】
export const extraStatus = [
  {
    key: 'overdue',
    value: 3,
    label: 'Overdue',
  },
]

export const filterFormConfig = [
  {
    name: 'status',
    label: 'Status',
    required: false,
    default: '',
    fieldType: 'dropdown',
    xs: 12,
    variant: 'filled',
    size: 'small',
    options: invoiceStatus,
  },
]

export const sortIdArr: { [key: string]: string } = {
  id: 'invoiceNumber',
  orderNumber: 'orderNumber',
  createdAt: 'createdAt',
  updatedAt: 'dueDate',
  originalBalance: 'originalBalanceAmount',
  openBalance: 'openBalanceAmount',
}
export default InvoiceListType
