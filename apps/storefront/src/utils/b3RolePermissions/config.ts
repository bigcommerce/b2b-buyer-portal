export const b2bPermissionsList = {
  getUserPermissionCode: 'get_users, get_user_detail',
  userActionsPermission: 'create_user, update_user, delete_user',
  getShoppingListPermission: 'get_shopping_lists, get_shopping_list_detail',
  shoppingListActionsPermission:
    /* cspell:disable-next-line */
    'create_shopping_list, deplicate_shopping_list, update_shopping_list, delete_shopping_list, create_shopping_list_item, update_shopping_list_item, delete_shopping_list_item',
  submitShoppingListPermission: 'submit_shopping_list_for_approval',
  approveShoppingListPermission: 'approve_draft_shopping_list',
  getAddressesPermission:
    'get_addresses, get_address_detail, get_default_shipping, get_default_billing',
  addressesActionsPermission: 'create_address, update_address, delete_address',
  getQuotesPermission: 'get_quotes, get_quote_detail, get_quote_pdf',
  quotesActionsPermission: 'create_quote, update_quote_message',
  quoteConvertToOrderPermission: 'checkout_with_quote',
  getOrderPermission: 'get_orders, get_order_detail',
  getInvoicesPermission:
    'get_invoices, get_invoice_detail, get_invoice_pdf, export_invoices, get_invoice_payments_history',
  invoicePayPermission: 'pay_invoice',
  /* cspell:disable-next-line */
  purchasabilityPermission: 'purchase_enable',
  companyHierarchyPermission: 'get_company_subsidiaries',
};

type B3PermissionsList = typeof b2bPermissionsList;

export type B2BPermissionParams = {
  [Key in keyof B3PermissionsList]: boolean;
};

export default b2bPermissionsList;
