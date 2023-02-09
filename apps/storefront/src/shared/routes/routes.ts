import {
  lazy,
} from 'react'

import {
  matchPath,
} from 'react-router'

import {
  GlobalState,
} from '@/shared/global/context/config'

const OrderList = lazy(() => import('../../pages/order/MyOrder'))

const CompanyOrderList = lazy(() => import('../../pages/order/CompanyOrder'))

const Dashboard = lazy(() => import('../../pages/dashboard/Dashboard'))

const OrderDetail = lazy(() => import('../../pages/orderDetail/OrderDetail'))

const InvoiceDetail = lazy(() => import('../../pages/invoiceDetail/InvoiceDetail'))

const Usermanagement = lazy(() => import('../../pages/usermanagement/Usermanagement'))

const AddressList = lazy(() => import('../../pages/address/Address'))

const ShippingLists = lazy(() => import('../../pages/shoppingLists/ShoppingLists'))

const QuoteDraft = lazy(() => import('../../pages/quote/QuoteDraft'))
const Quotes = lazy(() => import('../../pages/quote/QuotesList'))
const QuoteDetail = lazy(() => import('../../pages/quote/QuoteDetail'))

const AccountSetting = lazy(() => import('../../pages/accountSetting/AccountSetting'))
const ShoppingListDetails = lazy(() => import('../../pages/shoppingListDetails/ShoppingListDetails'))

const Registered = lazy(() => import('../../pages/registered/Registered'))

const RegisteredBCToB2B = lazy(() => import('../../pages/registered/RegisteredBCToB2B'))

const Login = lazy(() => import('../../pages/login/Login'))

const ForgotPassword = lazy(() => import('../../pages/login/ForgotPassword'))

const PDP = lazy(() => import('../../pages/pdp/PDP'))

const Quickorder = lazy(() => import('../../pages/quickorder/Quickorder'))

type RegisteredItem = typeof Registered

interface RouteItemBasic {
  path: string,
  name: string,
  permissions: number[], // 0: admin, 1: senior buyer, 2: junior buyer, 3: salesRep, 99: bc user
}

export interface RouteItem extends RouteItemBasic {
  component: RegisteredItem,
  isMenuItem: boolean,
  wsKey: string,
  configKey?: string,
  isTokenLogin: boolean,
}

export interface RouteFirstLevelItem extends RouteItemBasic{
  isProvider: boolean,
  component: RegisteredItem
}

const routes: RouteItem[] = [
  {
    path: '/orders',
    name: 'My Orders',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: OrderList,
    permissions: [0, 1, 2, 3, 99, 100],
    isTokenLogin: true,
  },
  {
    path: '/company-orders',
    name: 'Company Orders',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: CompanyOrderList,
    permissions: [0, 1, 2, 3],
    isTokenLogin: true,
  },
  {
    path: '/orderDetail/:id',
    name: 'Order Details',
    wsKey: 'router-orders',
    isMenuItem: false,
    component: OrderDetail,
    permissions: [0, 1, 2, 3, 99, 100],
    isTokenLogin: true,
  },
  {
    path: '/invoiceDetail/:id',
    name: 'Invoice Details',
    wsKey: 'router-invoice',
    isMenuItem: false,
    component: InvoiceDetail,
    permissions: [0, 1, 2, 3, 99, 100],
    isTokenLogin: true,
  },
  {
    path: '/addresses',
    name: 'Addresses',
    wsKey: 'router-address',
    isMenuItem: true,
    component: AddressList,
    configKey: 'addressBook',
    permissions: [0, 1, 2, 3, 99, 100],
    isTokenLogin: true,
  },
  {
    path: '/shoppingList/:id',
    name: 'Shopping List',
    wsKey: 'router-shopping-list',
    isMenuItem: false,
    component: ShoppingListDetails,
    permissions: [0, 1, 2, 3],
    isTokenLogin: true,
  },
  {
    path: '/user-management',
    name: 'User management',
    wsKey: 'router-userManagement',
    isMenuItem: true,
    component: Usermanagement,
    permissions: [0, 1, 3],
    isTokenLogin: true,
  },
  {
    path: '/shoppingLists',
    name: 'Shopping Lists',
    wsKey: 'shioppingLists',
    isMenuItem: true,
    component: ShippingLists,
    configKey: 'shoppingLists',
    permissions: [0, 1, 2, 3],
    isTokenLogin: true,
  },
  {
    path: '/quoteDraft',
    name: 'QuoteDraft',
    wsKey: 'quoteDraft',
    isMenuItem: false,
    component: QuoteDraft,
    configKey: 'quoteDraft',
    permissions: [0, 1, 2, 3, 99, 100],
    isTokenLogin: false,
  },
  {
    path: '/quotes',
    name: 'Quotes',
    wsKey: 'quotes',
    isMenuItem: true,
    component: Quotes,
    configKey: 'quotes',
    permissions: [0, 1, 2, 3, 99, 100],
    isTokenLogin: true,
  },
  {
    path: '/accountSetting',
    name: 'AccountSetting',
    wsKey: 'accountSetting',
    isMenuItem: true,
    component: AccountSetting,
    configKey: 'accountSetting',
    permissions: [0, 1, 2, 3, 99],
    isTokenLogin: true,
  },
  {
    path: '/purchased-products',
    name: 'Purchased products',
    wsKey: 'quickorder',
    isMenuItem: true,
    component: Quickorder,
    configKey: 'quickorder',
    permissions: [0, 1, 2, 3, 99],
    isTokenLogin: true,
  },
  {
    path: '/quoteDetail/:id',
    name: 'QuoteDetail',
    wsKey: 'quoteDetail',
    isMenuItem: false,
    component: QuoteDetail,
    configKey: 'quoteDetail',
    permissions: [0, 1, 2, 3, 99, 100],
    isTokenLogin: false,
  },
  {
    path: '/recently-viewed',
    name: 'Recently Viewed',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: Dashboard,
    permissions: [0, 1, 2, 3, 99, 100],
    isTokenLogin: true,
  },
  {
    path: '/',
    name: 'Dashboard',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: Dashboard,
    permissions: [0, 1, 2, 3, 99, 100],
    isTokenLogin: true,
  },
]

const firstLevelRouting: RouteFirstLevelItem[] = [
  {
    path: '/registered',
    name: 'registered',
    component: Registered,
    permissions: [0, 1, 2, 3, 99, 100],
    isProvider: true,
  },
  {
    path: '/login',
    name: 'Login',
    component: Login,
    permissions: [0, 1, 2, 3, 99, 100],
    isProvider: false,
  },
  {
    path: '/pdp',
    name: 'pdp',
    component: PDP,
    permissions: [0, 1, 2, 3, 99, 100],
    isProvider: false,
  },
  {
    path: '/forgotpassword',
    name: 'forgotpassword',
    component: ForgotPassword,
    permissions: [0, 1, 2, 3, 99, 100],
    isProvider: false,
  },
  {
    path: '/registeredbctob2b',
    name: 'registeredbctob2b',
    component: RegisteredBCToB2B,
    permissions: [0, 1, 2, 3, 99, 100],
    isProvider: true,
  },
]
const getAllowedRoutes = (globalState: GlobalState): RouteItem[] => {
  const {
    isB2BUser,
    role,
    isAgenting,
    storefrontConfig,
    productQuoteEnabled,
    cartQuoteEnabled,
  } = globalState

  return routes.filter((item: RouteItem) => {
    const {
      permissions = [],
      configKey,
    } = item

    // quotes is enabled
    if ((configKey === 'quotes' || configKey === 'quoteDraft') && !productQuoteEnabled && !cartQuoteEnabled) {
      return false
    }

    // b2b user
    if (!isB2BUser || (role === 3 && !isAgenting)) {
      return permissions.includes(99)
    }

    if (!permissions.includes(+role || 0) || !storefrontConfig) {
      return false
    }

    const config = storefrontConfig[item.configKey || ''] ?? {
      enabledStatus: true,
    }
    if (typeof config === 'boolean') {
      return config
    }
    return !!config.enabledStatus
  })
}

const gotoAllowedAppPage = (role: number, gotoPage: (url: string) => void) => {
  const {
    hash,
  } = window.location
  let url = hash.split('#')[1] || ''
  if (!url && role !== 100) url = role === 3 ? '/' : '/orders'
  const flag = routes.some((item: RouteItem) => matchPath(item.path, url) && item.permissions.includes(role))

  const isFirstLevelFlag = firstLevelRouting.some((item: RouteFirstLevelItem) => matchPath(item.path, url))
  if (flag || isFirstLevelFlag) gotoPage(url)
}

const getIsTokenGotoPage = (url: string): boolean => {
  const flag = routes.some((item: RouteItem) => matchPath(item.path, url) && !item.isTokenLogin)
  return flag
}

export {
  gotoAllowedAppPage,
  getAllowedRoutes,
  routes,
  getIsTokenGotoPage,
  firstLevelRouting,
}
