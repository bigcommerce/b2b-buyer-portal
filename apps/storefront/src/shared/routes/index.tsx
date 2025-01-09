import { lazy, LazyExoticComponent, ReactNode } from 'react';
import { matchPath } from 'react-router-dom';

import { PageProps } from '@/pages/PageProps';
import { store } from '@/store';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';
import { getB3PermissionsList } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import { isB2bTokenPage, logoutSession } from '@/utils/b3logout';

import b2bVerifyBcLoginStatus from '../../utils/b2bVerifyBcLoginStatus';
import { RouteFirstLevelItem, RouteItem, routeList } from '../routeList';

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

const routesMap: Record<string, LazyExoticComponent<(props: PageProps) => ReactNode>> = {
  '/dashboard': Dashboard,
  '/orders': OrderList,
  '/company-orders': CompanyOrderList,
  '/invoice': Invoice,
  '/quotes': Quotes,
  '/shoppingLists': ShippingLists,
  '/purchased-products': QuickOrder,
  '/orderDetail/:id': OrderDetail,
  '/invoiceDetail/:id': InvoiceDetail,
  '/addresses': AddressList,
  '/shoppingList/:id': ShoppingListDetails,
  '/user-management': UserManagement,
  '/quoteDraft': QuoteDraft,
  '/accountSettings': AccountSetting,
  '/quoteDetail/:id': QuoteDetail,
};

const routes: RouteItem[] = routeList.map((item: Partial<RouteItem>) => {
  return {
    ...item,
    component: routesMap[item.path ?? ''],
  } as RouteItem;
});

const firstLevelRouting: RouteFirstLevelItem[] = [
  {
    path: '/',
    name: '',
    component: HomePage,
    permissions: [0, 1, 2, 3, 4, 99, 100],
    isProvider: false,
  },
  {
    path: '/register',
    name: 'register',
    component: Registered,
    permissions: [0, 1, 2, 3, 4, 99, 100],
    isProvider: true,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    permissions: [0, 1, 2, 3, 4, 99, 100],
    isProvider: false,
  },
  {
    path: '/pdp',
    name: 'pdp',
    component: PDP,
    permissions: [0, 1, 2, 3, 4, 99, 100],
    isProvider: false,
  },
  {
    path: '/forgotPassword',
    name: 'forgotPassword',
    component: ForgotPassword,
    permissions: [0, 1, 2, 3, 4, 99, 100],
    isProvider: false,
  },
  {
    path: '/registeredbctob2b',
    name: 'registeredbctob2b',
    component: RegisteredBCToB2B,
    permissions: [0, 1, 2, 3, 4, 99, 100],
    isProvider: true,
  },
  {
    path: '/payment/:id',
    name: 'payment',
    component: InvoicePayment,
    permissions: [0, 1, 2, 3, 4, 99, 100],
    isProvider: false,
  },
];

const denyInvoiceRoles = [4, 99, 100];

const invoiceTypes = ['invoice?invoiceId', 'invoice?receiptId'];

const gotoAllowedAppPage = async (
  role: CustomerRole,
  gotoPage: (url: string) => void,
  isAccountEnter?: boolean,
) => {
  const { hash, pathname, href } = window.location;
  const currentState = store.getState();

  const { company } = currentState;
  const { companyRoleName } = company.customer;
  const isLoggedIn = company.customer || role !== CustomerRole.GUEST;
  if (!isLoggedIn) {
    gotoPage('/login?loginFlag=loggedOutLogin&&closeIsLogout=1');
    return;
  }

  const isInvoicePage = () => invoiceTypes.some((type: string) => href.includes(type));

  if (denyInvoiceRoles.includes(role) && isInvoicePage()) {
    gotoPage('/login?loginFlag=invoiceErrorTip');
    return;
  }
  try {
    const isBcLogin = await b2bVerifyBcLoginStatus();

    if (!isBcLogin && isB2bTokenPage()) {
      logoutSession();
      gotoPage('/login?loginFlag=deviceCrowdingLogIn');
      return;
    }
  } catch (err: unknown) {
    b2bLogger.error(err);
  }

  let url = hash.split('#')[1] || '';
  const IsRealJuniorBuyer =
    +role === CustomerRole.JUNIOR_BUYER && companyRoleName === 'Junior Buyer';
  const currentRole = !IsRealJuniorBuyer && +role === CustomerRole.JUNIOR_BUYER ? 1 : role;
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

    const { getShoppingListPermission, getOrderPermission } = getB3PermissionsList();
    let currentAuthorizedPages = '/orders';

    if (isB2BUser) {
      currentAuthorizedPages = getShoppingListPermission ? '/shoppingLists' : '/accountSettings';
      if (getOrderPermission)
        currentAuthorizedPages = IsRealJuniorBuyer ? currentAuthorizedPages : '/orders';
    }

    switch (currentRole) {
      case CustomerRole.JUNIOR_BUYER:
        url = currentAuthorizedPages;
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
      return item.permissions.includes(currentRole);
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

export { firstLevelRouting, getIsTokenGotoPage, gotoAllowedAppPage, routes };
