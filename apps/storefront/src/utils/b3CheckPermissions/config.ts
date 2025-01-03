export const b2bPermissionsMap = {
  getUserPermissionCode: 'get_users',
  getUserDetailPermissionCode: 'get_user_detail',
  userCreateActionsPermission: 'create_user',
  userUpdateActionsPermission: 'update_user',
  userDeleteActionsPermission: 'delete_user',

  getShoppingListPermission: 'get_shopping_lists',
  getShoppingListDetailPermission: 'get_shopping_list_detail',
  shoppingListCreateActionsPermission: 'create_shopping_list',
  /* cspell:disable */
  shoppingListDuplicateActionsPermission: 'deplicate_shopping_list',
  shoppingListUpdateActionsPermission: 'update_shopping_list',
  shoppingListDeleteActionsPermission: 'delete_shopping_list',
  shoppingListCreateItemActionsPermission: 'create_shopping_list_item',
  shoppingListUpdateItemActionsPermission: 'update_shopping_list_item',
  shoppingListDeleteItemActionsPermission: 'delete_shopping_list_item',
  submitShoppingListPermission: 'submit_shopping_list_for_approval',
  approveShoppingListPermission: 'approve_draft_shopping_list',

  getAddressesPermission: 'get_addresses',
  getAddressDetailPermission: 'get_address_detail',
  getDefaultShippingPermission: 'get_default_shipping',
  getDefaultBillingPermission: 'get_default_billing',
  addressesCreateActionsPermission: 'create_address',
  addressesUpdateActionsPermission: 'update_address',
  addressesDeleteActionsPermission: 'delete_address',

  getQuotesPermission: 'get_quotes',
  getQuoteDetailPermission: 'get_quote_detail',
  getQuotePDFPermission: 'get_quote_pdf',
  quotesCreateActionsPermission: 'create_quote',
  quotesUpdateMessageActionsPermission: 'update_quote_message',

  quoteConvertToOrderPermission: 'checkout_with_quote',

  getOrderPermission: 'get_orders',
  getOrderDetailPermission: 'get_order_detail',

  getInvoicesPermission: 'get_invoices',
  getInvoiceDetailPermission: 'get_invoice_detail',
  getInvoicePDFPermission: 'get_invoice_pdf',
  exportInvoicesPermission: 'export_invoices',
  getInvoicePaymentsHistoryPermission: 'get_invoice_payments_history',
  invoicePayPermission: 'pay_invoice',

  purchasabilityPermission: 'purchase_enable',

  companyHierarchyPermission: 'get_company_subsidiaries',
};

type B2BPermissionsMap = typeof b2bPermissionsMap;

export type B2BPermissionsMapParams = {
  [Key in keyof B2BPermissionsMap]: boolean;
};
