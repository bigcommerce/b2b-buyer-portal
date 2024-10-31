import { CustomerRole } from '@/types';

const allLeagcyPermission = [
  CustomerRole.SUPER_ADMIN,
  CustomerRole.SUPER_ADMIN_IN_AGENCY,
  CustomerRole.ADMIN,
  CustomerRole.SENIOR_BUYER,
  CustomerRole.JUNIOR_BUYER,
  CustomerRole.CUSTOM_ROLE,
  CustomerRole.B2C,
  CustomerRole.GUEST,
];
const leagcyPermissions = {
  dashboardPermissions: [CustomerRole.SUPER_ADMIN, CustomerRole.SUPER_ADMIN_IN_AGENCY],
  ordersPermissions: [
    CustomerRole.SUPER_ADMIN,
    CustomerRole.SUPER_ADMIN_IN_AGENCY,
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.CUSTOM_ROLE,
    CustomerRole.B2C,
    CustomerRole.GUEST,
  ],
  companyOrdersPermissions: [
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.SUPER_ADMIN,
    CustomerRole.CUSTOM_ROLE,
  ],
  invoicePermissions: [
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.SUPER_ADMIN,
    CustomerRole.CUSTOM_ROLE,
  ],
  quotesPermissions: allLeagcyPermission,
  shoppingListsPermissions: [
    CustomerRole.SUPER_ADMIN,
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.JUNIOR_BUYER,
    CustomerRole.CUSTOM_ROLE,
    CustomerRole.B2C,
  ],
  quickorderPermissions: [
    CustomerRole.SUPER_ADMIN,
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.JUNIOR_BUYER,
    CustomerRole.CUSTOM_ROLE,
    CustomerRole.B2C,
  ],
  orderDetailPermissions: allLeagcyPermission,
  invoiceDetailPermissions: [
    CustomerRole.SUPER_ADMIN,
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.CUSTOM_ROLE,
    CustomerRole.B2C,
    CustomerRole.GUEST,
  ],
  addressesPermissions: [
    CustomerRole.SUPER_ADMIN,
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.JUNIOR_BUYER,
    CustomerRole.CUSTOM_ROLE,
    CustomerRole.B2C,
    CustomerRole.GUEST,
  ],
  shoppingListDetailPermissions: [
    CustomerRole.SUPER_ADMIN,
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.JUNIOR_BUYER,
    CustomerRole.CUSTOM_ROLE,
    CustomerRole.B2C,
  ],
  userManagementPermissions: [
    CustomerRole.SUPER_ADMIN,
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.CUSTOM_ROLE,
  ],
  quoteDraftPermissions: allLeagcyPermission,
  accountSettingPermissions: [
    CustomerRole.SUPER_ADMIN,
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.JUNIOR_BUYER,
    CustomerRole.CUSTOM_ROLE,
    CustomerRole.B2C,
    CustomerRole.SUPER_ADMIN_IN_AGENCY,
  ],
  companyHierarchyPermissions: [
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.JUNIOR_BUYER,
    CustomerRole.CUSTOM_ROLE,
    CustomerRole.SUPER_ADMIN_IN_AGENCY,
  ],
  quoteDetailPermissions: allLeagcyPermission,
};

const denyInvoiceRoles = [CustomerRole.SUPER_ADMIN_IN_AGENCY, CustomerRole.B2C, CustomerRole.GUEST];

const newPermissions = {
  ordersPermissionCodes: 'get_orders, get_order_detail',
  companyOrdersPermissionCodes: 'get_orders, get_order_detail',
  invoicePermissionCodes:
    'get_invoices, get_invoice_detail, get_invoice_pdf, export_invoices, get_invoice_payments_history',
  quotesPermissionCodes: 'get_quotes, get_quote_detail, get_quote_pdf',
  shoppingListsPermissionCodes: 'get_shopping_lists, get_shopping_list_detail',
  orderDetailPerPermissionCodes: 'get_orders, get_order_detail',
  invoiceDetailPerPermissionCodes:
    'get_invoices, get_invoice_detail, get_invoice_pdf, export_invoices, get_invoice_payments_history',
  addressesPermissionCodes:
    'get_addresses, get_address_detail, get_default_shipping, get_default_billing',
  shoppingListDetailPermissionCodes: 'get_shopping_lists, get_shopping_list_detail',
  userManagementPermissionCodes: 'get_users, get_user_detail',
  quoteDraftPermissionCodes:
    'get_quotes,get_quote_detail, get_quote_pdf, create_quote, update_quote_message',
  quoteDetailPermissionCodes: 'get_quotes, get_quote_detail, get_quote_pdf',
};

export { leagcyPermissions, denyInvoiceRoles, allLeagcyPermission, newPermissions };
