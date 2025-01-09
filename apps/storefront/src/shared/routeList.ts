import { FC, LazyExoticComponent, ReactNode } from 'react';

import { PageProps } from '@/pages/PageProps';
import { GlobalState, QuoteConfigProps } from '@/shared/global/context/config';
import { store } from '@/store';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';
import { checkEveryPermissionsCode, getPermissionsInfo } from '@/utils';

export interface BuyerPortalRoute {
  path: string;
  name: string;
}

interface RouteItemBasic extends BuyerPortalRoute {
  component: FC<PageProps> | LazyExoticComponent<(props: PageProps) => ReactNode>;
  permissions: number[]; // 0: admin, 1: senior buyer, 2: junior buyer, 3: salesRep, 4: salesRep-【Not represented】, 99: bc user, 100: guest
}

export interface RouteItem extends RouteItemBasic {
  isMenuItem: boolean;
  wsKey: string;
  configKey?: string;
  isTokenLogin: boolean;
  pageTitle?: string;
  idLang: string;
  permissionCodes?: string;
}

export interface RouteFirstLevelItem extends RouteItemBasic {
  isProvider: boolean;
}

export const routeList: (BuyerPortalRoute | RouteItem)[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    wsKey: 'router-orders',
    isMenuItem: true,
    permissions: [3, 4],
    isTokenLogin: true,
    idLang: 'global.navMenu.dashboard',
  },
  {
    path: '/orders',
    name: 'My orders',
    wsKey: 'router-orders',
    isMenuItem: true,
    permissions: [0, 1, 3, 4, 99, 100],
    permissionCodes: 'get_orders, get_order_detail',
    isTokenLogin: true,
    idLang: 'global.navMenu.orders',
  },
  {
    path: '/company-orders',
    name: 'Company orders',
    wsKey: 'router-orders',
    isMenuItem: true,
    permissions: [0, 1, 3],
    permissionCodes: 'get_orders, get_order_detail',
    isTokenLogin: true,
    idLang: 'global.navMenu.companyOrders',
  },
  {
    path: '/invoice',
    name: 'Invoice',
    wsKey: 'invoice',
    isMenuItem: true,
    configKey: 'invoice',
    permissions: [0, 1, 3],
    permissionCodes:
      'get_invoices, get_invoice_detail, get_invoice_pdf, export_invoices, get_invoice_payments_history',
    isTokenLogin: true,
    idLang: 'global.navMenu.invoice',
  },
  {
    path: '/quotes',
    name: 'Quotes',
    wsKey: 'quotes',
    isMenuItem: true,
    configKey: 'quotes',
    permissions: [0, 1, 2, 3, 99, 100],
    permissionCodes: 'get_quotes, get_quote_detail, get_quote_pdf',
    isTokenLogin: true,
    idLang: 'global.navMenu.quotes',
  },
  {
    path: '/shoppingLists',
    name: 'Shopping lists',
    wsKey: 'shoppingLists',
    isMenuItem: true,
    configKey: 'shoppingLists',
    permissions: [0, 1, 2, 3, 99],
    permissionCodes: 'get_shopping_lists, get_shopping_list_detail',
    isTokenLogin: true,
    idLang: 'global.navMenu.shoppingLists',
  },
  {
    path: '/purchased-products',
    name: 'Quick order',
    pageTitle: 'Purchased products',
    wsKey: 'quickOrder',
    isMenuItem: true,
    configKey: 'quickOrderPad',
    permissions: [0, 1, 2, 3, 99],
    isTokenLogin: true,
    idLang: 'global.navMenu.quickOrder',
  },
  {
    path: '/orderDetail/:id',
    name: 'Order details',
    wsKey: 'router-orders',
    isMenuItem: false,
    permissions: [0, 1, 2, 3, 4, 99, 100],
    permissionCodes: 'get_orders, get_order_detail',
    isTokenLogin: true,
    idLang: 'global.navMenu.orderDetail',
  },
  {
    path: '/invoiceDetail/:id',
    name: 'Invoice details',
    wsKey: 'router-invoice',
    isMenuItem: false,
    permissions: [0, 1, 3, 99, 100],
    permissionCodes:
      'get_invoices, get_invoice_detail, get_invoice_pdf, export_invoices, get_invoice_payments_history',
    isTokenLogin: true,
    idLang: 'global.navMenu.invoiceDetail',
  },
  {
    path: '/addresses',
    name: 'Addresses',
    wsKey: 'router-address',
    isMenuItem: true,
    configKey: 'addressBook',
    permissions: [0, 1, 2, 3, 99, 100],
    permissionCodes: 'get_addresses, get_address_detail, get_default_shipping, get_default_billing',
    isTokenLogin: true,
    idLang: 'global.navMenu.addresses',
  },
  {
    path: '/shoppingList/:id',
    name: 'Shopping list',
    wsKey: 'router-shopping-list',
    isMenuItem: false,
    permissions: [0, 1, 2, 3, 99],
    permissionCodes: 'get_shopping_lists, get_shopping_list_detail',
    isTokenLogin: true,
    idLang: 'global.navMenu.shoppingList',
  },
  {
    path: '/user-management',
    name: 'User management',
    wsKey: 'router-userManagement',
    isMenuItem: true,
    permissions: [0, 1, 3],
    permissionCodes: 'get_users, get_user_detail',
    isTokenLogin: true,
    idLang: 'global.navMenu.userManagement',
  },
  {
    path: '/quoteDraft',
    name: 'Quote draft',
    wsKey: 'quoteDraft',
    isMenuItem: false,
    configKey: 'quoteDraft',
    permissions: [0, 1, 2, 3, 4, 99, 100],
    permissionCodes:
      'get_quotes,get_quote_detail, get_quote_pdf, create_quote, update_quote_message',
    isTokenLogin: false,
    idLang: 'global.navMenu.quoteDraft',
  },
  {
    path: '/accountSettings',
    name: 'Account settings',
    wsKey: 'accountSetting',
    isMenuItem: true,
    configKey: 'accountSettings',
    permissions: [0, 1, 2, 3, 4, 99],
    isTokenLogin: true,
    idLang: 'global.navMenu.accountSettings',
  },
  {
    path: '/quoteDetail/:id',
    name: 'Quote detail',
    wsKey: 'quoteDetail',
    isMenuItem: false,
    configKey: 'quoteDetail',
    permissions: [0, 1, 2, 3, 4, 99, 100],
    permissionCodes: 'get_quotes, get_quote_detail, get_quote_pdf',
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
  } else if (+company.customer.role === CustomerRole.SUPER_ADMIN) {
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
      if (isB2BUser && permissionCodes) {
        const isHasPermission = checkEveryPermissionsCode({
          code: permissionCodes,
        });

        if (path === '/company-orders' && isHasPermission) {
          const orderPermissionInfo = getPermissionsInfo('get_orders');
          return (
            orderPermissionInfo &&
            orderPermissionInfo?.permissionLevel &&
            +orderPermissionInfo.permissionLevel > 1
          );
        }
        return isHasPermission;
      }
      return true;
    };

    if (!isHasPermissionRole()) return false;

    if (path === '/dashboard') {
      return +role === CustomerRole.SUPER_ADMIN;
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

    return !!config.enabledStatus;
  });
};
