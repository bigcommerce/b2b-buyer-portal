import { FC, LazyExoticComponent, ReactElement } from 'react';

import { PAGES_SUBSIDIARIES_PERMISSION_KEYS } from '@/constants';
import { PageProps } from '@/pages/PageProps';
import { GlobalState, QuoteConfigProps } from '@/shared/global/context/config';
import { store } from '@/store';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';
import { checkEveryPermissionsCode } from '@/utils';
import { validatePermissionWithComparisonType } from '@/utils/b3CheckPermissions';

import { legacyPermissions, newPermissions } from './routes/config';

export interface BuyerPortalRoute {
  path: string;
  name: string;
  isMenuItem?: boolean;
}

export interface RouteItemBasic extends BuyerPortalRoute {
  component: FC<PageProps> | LazyExoticComponent<(props: PageProps) => ReactElement>;
  permissions: number[]; // 0: admin, 1: senior buyer, 2: junior buyer, 3: salesRep, 4: salesRep-【Not represented】, 99: bc user, 100: guest
}

export interface RouteItem extends RouteItemBasic {
  wsKey: string;
  configKey?: string;
  isTokenLogin: boolean;
  pageTitle?: string;
  idLang: string;
  permissionCodes?: string;
  subsidiariesCompanyKey?: (typeof PAGES_SUBSIDIARIES_PERMISSION_KEYS)[number]['key'];
}

const {
  dashboardPermissions,
  ordersPermissions,
  companyOrdersPermissions,
  invoicePermissions,
  quotesPermissions,
  shoppingListsPermissions,
  quickOrderPermissions,
  orderDetailPermissions,
  addressesPermissions,
  shoppingListDetailPermissions,
  userManagementPermissions,
  quoteDraftPermissions,
  accountSettingPermissions,
  companyHierarchyPermissions,
  quoteDetailPermissions,
} = legacyPermissions;

const {
  ordersPermissionCodes,
  companyOrdersPermissionCodes,
  invoicePermissionCodes,
  quotesPermissionCodes,
  shoppingListsPermissionCodes,
  orderDetailPerPermissionCodes,
  addressesPermissionCodes,
  shoppingListDetailPermissionCodes,
  userManagementPermissionCodes,
  quoteDraftPermissionCodes,
  quoteDetailPermissionCodes,
  companyHierarchyPermissionCodes,
  quickOrderPermissionCodes,
} = newPermissions;

export const routeList: (BuyerPortalRoute | RouteItem)[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    wsKey: 'router-orders',
    isMenuItem: true,
    permissions: dashboardPermissions,
    isTokenLogin: true,
    idLang: 'global.navMenu.dashboard',
  },
  {
    path: '/orders',
    name: 'My orders',
    subsidiariesCompanyKey: 'order',
    wsKey: 'router-orders',
    isMenuItem: true,
    permissions: ordersPermissions,
    permissionCodes: ordersPermissionCodes,
    isTokenLogin: true,
    idLang: 'global.navMenu.orders',
  },
  {
    path: '/company-orders',
    name: 'Company orders',
    subsidiariesCompanyKey: 'order',
    wsKey: 'router-orders',
    isMenuItem: true,
    permissions: companyOrdersPermissions,
    permissionCodes: companyOrdersPermissionCodes,
    isTokenLogin: true,
    idLang: 'global.navMenu.companyOrders',
  },
  {
    path: '/invoice',
    name: 'Invoice',
    subsidiariesCompanyKey: 'invoice',
    wsKey: 'invoice',
    isMenuItem: true,
    configKey: 'invoice',
    permissions: invoicePermissions,
    permissionCodes: invoicePermissionCodes,
    isTokenLogin: true,
    idLang: 'global.navMenu.invoice',
  },
  {
    path: '/quotes',
    name: 'Quotes',
    subsidiariesCompanyKey: 'quotes',
    wsKey: 'quotes',
    isMenuItem: true,
    configKey: 'quotes',
    permissions: quotesPermissions,
    permissionCodes: quotesPermissionCodes,
    isTokenLogin: true,
    idLang: 'global.navMenu.quotes',
  },
  {
    path: '/shoppingLists',
    name: 'Shopping lists',
    subsidiariesCompanyKey: 'shoppingLists',
    wsKey: 'shoppingLists',
    isMenuItem: true,
    configKey: 'shoppingLists',
    permissions: shoppingListsPermissions,
    permissionCodes: shoppingListsPermissionCodes,
    isTokenLogin: true,
    idLang: 'global.navMenu.shoppingLists',
  },
  {
    path: '/purchased-products',
    name: 'Quick order',
    pageTitle: 'Purchased products',
    subsidiariesCompanyKey: 'quickOrder',
    wsKey: 'quickOrder',
    isMenuItem: true,
    configKey: 'quickOrderPad',
    permissions: quickOrderPermissions,
    permissionCodes: quickOrderPermissionCodes,
    isTokenLogin: true,
    idLang: 'global.navMenu.quickOrder',
  },
  {
    path: '/orderDetail/:id',
    name: 'Order details',
    wsKey: 'router-orders',
    subsidiariesCompanyKey: 'order',
    isMenuItem: false,
    permissions: orderDetailPermissions,
    permissionCodes: orderDetailPerPermissionCodes,
    isTokenLogin: true,
    idLang: 'global.navMenu.orderDetail',
  },
  {
    path: '/addresses',
    name: 'Addresses',
    subsidiariesCompanyKey: 'addresses',
    wsKey: 'router-address',
    isMenuItem: true,
    configKey: 'addressBook',
    permissions: addressesPermissions,
    permissionCodes: addressesPermissionCodes,
    isTokenLogin: true,
    idLang: 'global.navMenu.addresses',
  },
  {
    path: '/shoppingList/:id',
    name: 'Shopping list',
    wsKey: 'router-shopping-list',
    isMenuItem: false,
    permissions: shoppingListDetailPermissions,
    permissionCodes: shoppingListDetailPermissionCodes,
    isTokenLogin: true,
    idLang: 'global.navMenu.shoppingList',
  },
  {
    path: '/user-management',
    name: 'User management',
    subsidiariesCompanyKey: 'userManagement',
    wsKey: 'router-userManagement',
    isMenuItem: true,
    permissions: userManagementPermissions,
    permissionCodes: userManagementPermissionCodes,
    isTokenLogin: true,
    idLang: 'global.navMenu.userManagement',
  },
  {
    path: '/quoteDraft',
    name: 'Quote draft',
    wsKey: 'quoteDraft',
    isMenuItem: false,
    configKey: 'quoteDraft',
    permissions: quoteDraftPermissions,
    permissionCodes: quoteDraftPermissionCodes,
    isTokenLogin: false,
    idLang: 'global.navMenu.quoteDraft',
  },
  {
    path: '/accountSettings',
    name: 'Account settings',
    wsKey: 'accountSetting',
    isMenuItem: true,
    configKey: 'accountSettings',
    permissions: accountSettingPermissions,
    isTokenLogin: true,
    idLang: 'global.navMenu.accountSettings',
  },
  {
    path: '/company-hierarchy',
    name: 'Company hierarchy',
    subsidiariesCompanyKey: 'companyHierarchy',
    wsKey: 'companyHierarchy',
    isMenuItem: true,
    configKey: 'companyHierarchy',
    permissions: companyHierarchyPermissions,
    permissionCodes: companyHierarchyPermissionCodes,
    isTokenLogin: true,
    idLang: 'global.navMenu.companyHierarchy',
  },
  {
    path: '/quoteDetail/:id',
    name: 'Quote detail',
    wsKey: 'quoteDetail',
    isMenuItem: false,
    configKey: 'quoteDetail',
    permissions: quoteDetailPermissions,
    permissionCodes: quoteDetailPermissionCodes,
    isTokenLogin: false,
    idLang: 'global.navMenu.quoteDetail',
  },
];

export const getAllowedRoutesWithoutComponent = (globalState: GlobalState): BuyerPortalRoute[] => {
  const { storefrontConfig, quoteConfig } = globalState;
  const { company, b2bFeatures } = store.getState();
  const { isAgenting } = b2bFeatures.masqueradeCompany;
  const { role } = company.customer;
  let isB2BUser = false;

  if (
    company.customer.userType === UserTypes.MULTIPLE_B2C &&
    company.companyInfo.status === CompanyStatus.APPROVED
  ) {
    isB2BUser = true;
  } else if (Number(company.customer.role) === CustomerRole.SUPER_ADMIN) {
    isB2BUser = true;
  }

  return routeList.filter((item: Partial<RouteItem>) => {
    const { permissions = [], permissionCodes, path } = item;

    if (role === CustomerRole.SUPER_ADMIN && !isAgenting) {
      return permissions.includes(4);
    }

    // bc user
    if (!isB2BUser) {
      const navListKey = storefrontConfig && storefrontConfig[item.configKey || ''];

      if (item.configKey === 'quotes') {
        if (role === CustomerRole.GUEST) {
          const quoteGuest =
            quoteConfig.find((config: QuoteConfigProps) => config.key === 'quote_for_guest')
              ?.value || '0';
          return quoteGuest === '1' && navListKey;
        }
        if (role === CustomerRole.B2C) {
          const quoteIndividualCustomer =
            quoteConfig.find(
              (config: QuoteConfigProps) => config.key === 'quote_for_individual_customer',
            )?.value || '0';
          return quoteIndividualCustomer === '1' && navListKey;
        }
      }
      if (item.configKey === 'shoppingLists') {
        const shoppingListOnProductPage = quoteConfig.find(
          (config: QuoteConfigProps) => config.key === 'shopping_list_on_product_page',
        )?.extraFields;
        if (role === CustomerRole.GUEST) {
          return shoppingListOnProductPage?.guest && navListKey;
        }
        if (role === CustomerRole.B2C) {
          return shoppingListOnProductPage?.b2c && navListKey;
        }
      }
      if (typeof navListKey === 'boolean') return navListKey;
      return permissions.includes(CustomerRole.B2C);
    }

    // b2b user
    const isHasPermissionRole = () => {
      if (!isB2BUser || !permissionCodes) {
        return true;
      }

      const hasPermission = checkEveryPermissionsCode(permissionCodes);

      if (path === '/company-orders' && hasPermission) {
        return validatePermissionWithComparisonType({
          code: item.permissionCodes,
          level: 2,
          containOrEqual: 'contain',
        });
      }

      return hasPermission;
    };

    if (!isHasPermissionRole()) return false;

    if (path === '/dashboard') {
      return Number(role) === CustomerRole.SUPER_ADMIN;
    }

    if (!storefrontConfig) {
      return false;
    }

    if (item.configKey === 'quotes') {
      const quoteB2B =
        quoteConfig.find((config: QuoteConfigProps) => config.key === 'quote_for_b2b')?.value ||
        '0';
      return storefrontConfig.quotes && quoteB2B === '1';
    }

    if (item.configKey === 'shoppingLists') {
      const shoppingListOnProductPage = quoteConfig.find(
        (config: QuoteConfigProps) => config.key === 'shopping_list_on_product_page',
      )?.extraFields;
      return storefrontConfig.shoppingLists && shoppingListOnProductPage?.b2b;
    }

    if (item.configKey === 'quickOrderPad') {
      return storefrontConfig.quickOrderPad && storefrontConfig.buyAgain;
    }
    const config = storefrontConfig[item.configKey || ''] ?? {
      enabledStatus: true,
    };
    if (typeof config === 'boolean') {
      return config;
    }
    if (item.configKey === 'invoice') {
      return !!config.enabledStatus && !!config.value;
    }

    return !!config.enabledStatus && permissions.includes(Number(role));
  });
};
