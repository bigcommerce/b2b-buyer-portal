import { lazy, LazyExoticComponent, ReactElement } from 'react';
import { matchPath } from 'react-router-dom';

import { PageProps } from '@/pages/PageProps';
import { store } from '@/store';
import { CompanyStatus, CustomerRole, UserTypes } from '@/types';
import { b2bJumpPath } from '@/utils';
import b2bLogger from '@/utils/b3Logger';
import { isB2bTokenPage, logoutSession } from '@/utils/b3logout';

import b2bVerifyBcLoginStatus from '../../utils/b2bVerifyBcLoginStatus';
import { GlobalState } from '../global/context/config';
import {
  BuyerPortalRoute,
  getAllowedRoutesWithoutComponent,
  RouteFirstLevelItem,
  RouteItem,
  routeList,
} from '../routeList';

import { allLegacyPermission, denyInvoiceRoles } from './config';

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

const routesMap: Record<string, LazyExoticComponent<(props: PageProps) => ReactElement>> = {
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
  '/company-hierarchy': CompanyHierarchy,
};

function addComponentToRoutes(routes: BuyerPortalRoute[]): RouteItem[] {
  return routes.map((item) => {
    return {
      ...item,
      component: routesMap[item.path],
    } as RouteItem;
  });
}

const routes: RouteItem[] = addComponentToRoutes(routeList);

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
    path: '/forgotPassword',
    name: 'forgotPassword',
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

    const currentAuthorizedPages = isB2BUser ? b2bJumpPath(+role) : '/orders';

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

const getAllowedRoutes = (globalState: GlobalState) =>
  addComponentToRoutes(getAllowedRoutesWithoutComponent(globalState));

export { getAllowedRoutes, firstLevelRouting, getIsTokenGotoPage, gotoAllowedAppPage, routes };
