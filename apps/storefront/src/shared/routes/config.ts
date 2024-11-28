import { CustomerRole } from '@/types';
import { b2bPermissionsList } from '@/utils/b3RolePermissions/config';

const allLeagcyPermission = [
  CustomerRole.SUPER_ADMIN,
  CustomerRole.SUPER_ADMIN_BEFORE_AGENCY,
  CustomerRole.ADMIN,
  CustomerRole.SENIOR_BUYER,
  CustomerRole.JUNIOR_BUYER,
  CustomerRole.CUSTOM_ROLE,
  CustomerRole.B2C,
  CustomerRole.GUEST,
];
const leagcyPermissions = {
  dashboardPermissions: [CustomerRole.SUPER_ADMIN, CustomerRole.SUPER_ADMIN_BEFORE_AGENCY],
  ordersPermissions: [
    CustomerRole.SUPER_ADMIN,
    CustomerRole.SUPER_ADMIN_BEFORE_AGENCY,
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
  quotesPermissions: [
    CustomerRole.SUPER_ADMIN,
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.JUNIOR_BUYER,
    CustomerRole.CUSTOM_ROLE,
    CustomerRole.B2C,
    CustomerRole.GUEST,
  ],
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
    CustomerRole.SUPER_ADMIN_BEFORE_AGENCY,
  ],
  companyHierarchyPermissions: [
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.JUNIOR_BUYER,
    CustomerRole.CUSTOM_ROLE,
  ],
  quoteDetailPermissions: allLeagcyPermission,
};

const denyInvoiceRoles = [
  CustomerRole.SUPER_ADMIN_BEFORE_AGENCY,
  CustomerRole.B2C,
  CustomerRole.GUEST,
];

const newPermissions = {
  ordersPermissionCodes: b2bPermissionsList.getOrderPermission,
  companyOrdersPermissionCodes: b2bPermissionsList.getOrderPermission,
  invoicePermissionCodes: b2bPermissionsList.getInvoicesPermission,
  quotesPermissionCodes: b2bPermissionsList.getQuotesPermission,
  shoppingListsPermissionCodes: b2bPermissionsList.getShoppingListPermission,
  orderDetailPerPermissionCodes: b2bPermissionsList.getOrderPermission,
  invoiceDetailPerPermissionCodes: b2bPermissionsList.getInvoicesPermission,
  addressesPermissionCodes: b2bPermissionsList.getAddressesPermission,
  shoppingListDetailPermissionCodes: b2bPermissionsList.getShoppingListPermission,
  userManagementPermissionCodes: b2bPermissionsList.getUserPermissionCode,
  quoteDraftPermissionCodes: b2bPermissionsList.quotesActionsPermission,
  quoteDetailPermissionCodes: b2bPermissionsList.getQuotesPermission,
  companyHierarchyPermissionCodes: b2bPermissionsList.companyHierarchyPermission,
};

export { leagcyPermissions, denyInvoiceRoles, allLeagcyPermission, newPermissions };
