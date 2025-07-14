import { CustomerRole } from '@/types';
import { b2bPermissionsMap } from '@/utils/b3CheckPermissions/config';

const allLegacyPermission = [
  CustomerRole.SUPER_ADMIN,
  CustomerRole.SUPER_ADMIN_BEFORE_AGENCY,
  CustomerRole.ADMIN,
  CustomerRole.SENIOR_BUYER,
  CustomerRole.JUNIOR_BUYER,
  CustomerRole.CUSTOM_ROLE,
  CustomerRole.B2C,
  CustomerRole.GUEST,
];
const legacyPermissions = {
  dashboardPermissions: [CustomerRole.SUPER_ADMIN, CustomerRole.SUPER_ADMIN_BEFORE_AGENCY],
  ordersPermissions: [
    CustomerRole.SUPER_ADMIN,
    CustomerRole.SUPER_ADMIN_BEFORE_AGENCY,
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.JUNIOR_BUYER,
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
  quickOrderPermissions: [
    CustomerRole.SUPER_ADMIN,
    CustomerRole.ADMIN,
    CustomerRole.SENIOR_BUYER,
    CustomerRole.JUNIOR_BUYER,
    CustomerRole.CUSTOM_ROLE,
    CustomerRole.B2C,
  ],
  orderDetailPermissions: allLegacyPermission,
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
  quoteDraftPermissions: allLegacyPermission,
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
  quoteDetailPermissions: allLegacyPermission,
};

const denyInvoiceRoles = [
  CustomerRole.SUPER_ADMIN_BEFORE_AGENCY,
  CustomerRole.B2C,
  CustomerRole.GUEST,
];

const newPermissions = {
  ordersPermissionCodes: b2bPermissionsMap.getOrderPermission,
  companyOrdersPermissionCodes: b2bPermissionsMap.getOrderPermission,
  invoicePermissionCodes: b2bPermissionsMap.getInvoicesPermission,
  quotesPermissionCodes: b2bPermissionsMap.getQuotesPermission,
  shoppingListsPermissionCodes: b2bPermissionsMap.getShoppingListPermission,
  orderDetailPerPermissionCodes: b2bPermissionsMap.getOrderDetailPermission,
  addressesPermissionCodes: b2bPermissionsMap.getAddressesPermission,
  shoppingListDetailPermissionCodes: b2bPermissionsMap.getShoppingListDetailPermission,
  userManagementPermissionCodes: b2bPermissionsMap.getUserPermissionCode,
  quoteDraftPermissionCodes: b2bPermissionsMap.quotesCreateActionsPermission,
  quoteDetailPermissionCodes: b2bPermissionsMap.getQuoteDetailPermission,
  companyHierarchyPermissionCodes: b2bPermissionsMap.companyHierarchyPermission,
  quickOrderPermissionCodes: b2bPermissionsMap.getOrderPermission,
};

export { legacyPermissions, denyInvoiceRoles, allLegacyPermission, newPermissions };
