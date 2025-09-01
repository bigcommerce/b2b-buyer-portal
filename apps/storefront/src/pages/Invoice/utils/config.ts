// NORMAL:   ;  DETAIL:  ; CHECKOUT:  ;
const InvoiceListType = {
  NORMAL: 'normal',
  DETAIL: 'detail',
  CHECKOUT: 'checkout',
};

// invoice status
// (0, "open"), (1, "partial paid"), (2, "Paid")
const invoiceStatus = [
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
];

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
];

export const filterFormConfigsTranslationVariables: { [key: string]: string } = {
  status: 'invoice.filterStatus.title',
  open: 'invoice.filterStatus.open',
  partialPaid: 'invoice.filterStatus.partiallyPaid',
  paid: 'invoice.filterStatus.paid',
  overdue: 'invoice.filterStatus.overdue',
};

export const defaultSortKey = 'id';

export const sortIdArr: { [key: string]: string } = {
  id: 'invoiceNumber',
  orderNumber: 'orderNumber',
  createdAt: 'createdAt',
  updatedAt: 'dueDate',
  originalBalance: 'originalBalanceAmount',
  openBalance: 'openBalanceAmount',
  status: 'status',
};

export const exportOrderByArr: { [key: string]: string } = {
  invoiceNumber: 'invoice_number',
  orderNumber: 'order_number',
  createdAt: 'created_at',
  dueDate: 'due_date',
  originalBalanceAmount: 'original_balance_amount',
  openBalanceAmount: 'open_balance_amount',
};
export default InvoiceListType;
