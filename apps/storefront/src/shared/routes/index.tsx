import { FC, lazy } from 'react';
import { matchPath } from 'react-router-dom';

import { PAGES_SUBSIDIARIES_PERMISSION_KEYS } from '@/constants';
import { type PageProps } from '@/pages/PageProps';
import { GlobalState, QuoteConfigProps } from '@/shared/global/context/config';
import { getCustomerInfo } from '@/shared/service/bc';
import { store } from '@/store';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';
import { b2bGotoRoute, checkEveryPermissionsCode } from '@/utils';
import { verifyCompanyLevelPermissionByCode } from '@/utils/b3CheckPermissions';
import b2bLogger from '@/utils/b3Logger';
import { isB2bTokenPage, logoutSession } from '@/utils/b3logout';

import { allLegacyPermission, denyInvoiceRoles, legacyPermissions, newPermissions } from './config';

const AccountSetting = lazy(() => import('@/pages/AccountSetting'));
const AddressList = lazy(() => import('@/pages/Address'));
const CompanyOrderList = lazy(() => import('@/pages/CompanyOrder'));
const Dashboard = lazy(() => import('@/pages/Dashboard'));
const ForgotPassword = lazy(() => import('@/pages/ForgotPassword'));
const HomePage = lazy(() => import('@/pages/HomePage'));
const Invoice = lazy(() => import('@/pages/Invoice'));
const InvoiceDetail = lazy(() => import('@/pages/InvoiceDetail'));
const InvoicePayment = lazy(() => import('@/pages/InvoicePayment'));
const Login = lazy(() => import('@/pages/Login'));
const OrderDetail = lazy(() => import('@/pages/OrderDetail'));
const OrderList = lazy(() => import('@/pages/MyOrder'));
const PDP = lazy(() => import('@/pages/PDP'));
const QuickOrder = lazy(() => import('@/pages/QuickOrder'));
const QuoteDetail = lazy(() => import('@/pages/QuoteDetail'));
const QuoteDraft = lazy(() => import('@/pages/QuoteDraft'));
const Quotes = lazy(() => import('@/pages/QuotesList'));
const Registered = lazy(() => import('@/pages/Registered'));
const RegisteredBCToB2B = lazy(() => import('@/pages/RegisteredBCToB2B'));
const ShippingLists = lazy(() => import('@/pages/ShoppingLists'));
const ShoppingListDetails = lazy(() => import('@/pages/ShoppingListDetails'));
const UserManagement = lazy(() => import('@/pages/UserManagement'));
const CompanyHierarchy = lazy(() => import('@/pages/CompanyHierarchy'));

interface RouteItemBasic {
  component: FC<PageProps>;
  path: string;
  name: string;
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
  subsidiariesCompanyKey?: (typeof PAGES_SUBSIDIARIES_PERMISSION_KEYS)[number]['key'];
}

export interface RouteFirstLevelItem extends RouteItemBasic {
  isProvider: boolean;
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
  invoiceDetailPermissions,
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
  invoiceDetailPerPermissionCodes,
  addressesPermissionCodes,
  shoppingListDetailPermissionCodes,
  userManagementPermissionCodes,
  quoteDraftPermissionCodes,
  quoteDetailPermissionCodes,
  companyHierarchyPermissionCodes,
} = newPermissions;

const routes: RouteItem[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: Dashboard,
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
    component: OrderList,
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
    component: CompanyOrderList,
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
    component: Invoice,
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
    component: Quotes,
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
    component: ShippingLists,
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
    wsKey: 'quickOrder',
    isMenuItem: true,
    component: QuickOrder,
    configKey: 'quickOrderPad',
    permissions: quickOrderPermissions,
    isTokenLogin: true,
    idLang: 'global.navMenu.quickOrder',
  },
  {
    path: '/orderDetail/:id',
    name: 'Order details',
    wsKey: 'router-orders',
    subsidiariesCompanyKey: 'order',
    isMenuItem: false,
    component: OrderDetail,
    permissions: orderDetailPermissions,
    permissionCodes: orderDetailPerPermissionCodes,
    isTokenLogin: true,
    idLang: 'global.navMenu.orderDetail',
  },
  {
    path: '/invoiceDetail/:id',
    name: 'Invoice details',
    wsKey: 'router-invoice',
    subsidiariesCompanyKey: 'invoice',
    isMenuItem: false,
    component: InvoiceDetail,
    permissions: invoiceDetailPermissions,
    permissionCodes: invoiceDetailPerPermissionCodes,
    isTokenLogin: true,
    idLang: 'global.navMenu.invoiceDetail',
  },
  {
    path: '/addresses',
    name: 'Addresses',
    subsidiariesCompanyKey: 'addresses',
    wsKey: 'router-address',
    isMenuItem: true,
    component: AddressList,
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
    component: ShoppingListDetails,
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
    component: UserManagement,
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
    component: QuoteDraft,
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
    component: AccountSetting,
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
    component: CompanyHierarchy,
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
    component: QuoteDetail,
    configKey: 'quoteDetail',
    permissions: quoteDetailPermissions,
    permissionCodes: quoteDetailPermissionCodes,
    isTokenLogin: false,
    idLang: 'global.navMenu.quoteDetail',
  },
];

const firstLevelRouting: RouteFirstLevelItem[] = [
  {
    path: '/',
    name: '',
    component: HomePage,
    permissions: allLegacyPermission,
    isProvider: false,
  },
  {
    path: '/register',
    name: 'register',
    component: Registered,
    permissions: allLegacyPermission,
    isProvider: true,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    permissions: allLegacyPermission,
    isProvider: false,
  },
  {
    path: '/pdp',
    name: 'pdp',
    component: PDP,
    permissions: allLegacyPermission,
    isProvider: false,
  },
  {
    path: '/forgotpassword',
    name: 'forgotpassword',
    component: ForgotPassword,
    permissions: allLegacyPermission,
    isProvider: false,
  },
  {
    path: '/registeredbctob2b',
    name: 'registeredbctob2b',
    component: RegisteredBCToB2B,
    permissions: allLegacyPermission,
    isProvider: true,
  },
  {
    path: '/payment/:id',
    name: 'payment',
    component: InvoicePayment,
    permissions: allLegacyPermission,
    isProvider: false,
  },
];

const invoiceTypes = ['invoice?invoiceId', 'invoice?receiptId'];

const getAllowedRoutes = (globalState: GlobalState): RouteItem[] => {
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

  return routes.filter((item: RouteItem) => {
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
          return verifyCompanyLevelPermissionByCode({
            code: item.permissionCodes,
            level: 2,
            containOrEqual: 'contain',
          });
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

    return !!config.enabledStatus && permissions.includes(+role);
  });
};

const gotoAllowedAppPage = async (
  role: CustomerRole,
  gotoPage: (url: string) => void,
  isAccountEnter?: boolean,
) => {
  const { hash, pathname, href } = window.location;
  const currentState = store.getState();

  const { company } = currentState;
  const isLoggedIn = company.customer || role !== CustomerRole.GUEST;
  if (!isLoggedIn) {
    gotoPage('/login?loginFlag=3&&closeIsLogout=1');
    return;
  }

  const isInvoicePage = () => invoiceTypes.some((type: string) => href.includes(type));

  if (denyInvoiceRoles.includes(role) && isInvoicePage()) {
    gotoPage('/login?loginFlag=7');
    return;
  }
  try {
    const {
      data: { customer },
    } = await getCustomerInfo();

    if (!customer && isB2bTokenPage()) {
      logoutSession();
      gotoPage('/login?loginFlag=6');
      return;
    }
  } catch (err: unknown) {
    b2bLogger.error(err);
  }

  let url = hash.split('#')[1] || '';

  if ((!url && role !== CustomerRole.GUEST && pathname.includes('account.php')) || isAccountEnter) {
    let isB2BUser = false;
    if (
      company.customer.userType === UserTypes.MULTIPLE_B2C &&
      company.companyInfo.status === CompanyStatus.APPROVED
    ) {
      isB2BUser = true;
    } else if (+company.customer.role === CustomerRole.SUPER_ADMIN) {
      isB2BUser = true;
    }

    const currentAuthorizedPages = isB2BUser ? b2bGotoRoute(+role) : '/orders';

    switch (+role) {
      case CustomerRole.JUNIOR_BUYER:
        url = '/shoppingLists';
        break;
      case CustomerRole.SUPER_ADMIN:
        url = '/dashboard';
        break;
      default:
        url = currentAuthorizedPages;
        break;
    }
  }

  const flag = routes.some((item: RouteItem) => {
    if (matchPath(item.path, url) || isInvoicePage()) {
      return item.permissions.includes(+role);
    }
    return false;
  });

  const isFirstLevelFlag = firstLevelRouting.some((item: RouteFirstLevelItem) => {
    if (url.includes('/login?') || url.includes('payment')) {
      return true;
    }
    return matchPath(item.path, url);
  });
  if (flag || isFirstLevelFlag) gotoPage(url);
};

const getIsTokenGotoPage = (url: string): boolean => {
  const flag = routes.some((item: RouteItem) => matchPath(item.path, url) && !item.isTokenLogin);
  return flag;
};

export { firstLevelRouting, getAllowedRoutes, getIsTokenGotoPage, gotoAllowedAppPage, routes };
