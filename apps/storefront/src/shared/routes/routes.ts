import {
  lazy,
} from 'react'

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

// const AccountSetting = lazy(() => import('../../pages/accountSetting/AccountSetting'))
const ShoppingListDetails = lazy(() => import('../../pages/shoppingListDetails/ShoppingListDetails'))

type OrderItem = typeof OrderList

export interface RouteItem {
  path: string,
  name: string,
  component: OrderItem,
  isMenuItem: boolean,
  wsKey: string,
  configKey?: string,
  permissions: number[], // 0: admin, 1: senior buyer, 2: junior buyer, 3: salesRep, 99: bc user
}

const routes: RouteItem[] = [
  {
    path: '/orders',
    name: 'My Orders',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: OrderList,
    permissions: [0, 1, 2, 3, 99, 100],
  },
  {
    path: '/company-orders',
    name: 'Company Orders',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: CompanyOrderList,
    permissions: [0, 1, 2, 3],
  },
  {
    path: '/orderDetail/:id',
    name: 'Order Details',
    wsKey: 'router-orders',
    isMenuItem: false,
    component: OrderDetail,
    permissions: [0, 1, 2, 3, 99, 100],
  },
  {
    path: '/invoiceDetail/:id',
    name: 'Invoice Details',
    wsKey: 'router-invoice',
    isMenuItem: false,
    component: InvoiceDetail,
    permissions: [0, 1, 2, 3, 99, 100],
  },
  {
    path: '/addresses',
    name: 'Addresses',
    wsKey: 'router-address',
    isMenuItem: true,
    component: AddressList,
    configKey: 'addressBook',
    permissions: [0, 1, 2, 3, 99, 100],
  },
  {
    path: '/shoppingList/:id',
    name: 'Shopping List',
    wsKey: 'router-shopping-list',
    isMenuItem: false,
    component: ShoppingListDetails,
    permissions: [0, 1, 2, 3],
  },
  {
    path: '/user-management',
    name: 'User management',
    wsKey: 'router-userManagement',
    isMenuItem: true,
    component: Usermanagement,
    permissions: [0, 1, 3],
  },
  {
    path: '/shoppingLists',
    name: 'Shopping Lists',
    wsKey: 'shioppingLists',
    isMenuItem: true,
    component: ShippingLists,
    configKey: 'shoppingLists',
    permissions: [0, 1, 2, 3],
  },
  {
    path: '/quoteDraft',
    name: 'QuoteDraft',
    wsKey: 'quoteDraft',
    isMenuItem: false,
    component: QuoteDraft,
    configKey: 'quoteDraft',
    permissions: [0, 1, 2, 3, 99, 100],
  },
  {
    path: '/quotes',
    name: 'Quotes',
    wsKey: 'quotes',
    isMenuItem: true,
    component: Quotes,
    configKey: 'quotes',
    permissions: [0, 1, 2, 3, 99, 100],
  },
  {
    path: '/quoteDetail/:id',
    name: 'QuoteDetail',
    wsKey: 'quoteDetail',
    isMenuItem: false,
    component: QuoteDetail,
    configKey: 'quoteDetail',
    permissions: [0, 1, 2, 3, 99],
  },
  {
    path: '/recently-viewed',
    name: 'Recently Viewed',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: Dashboard,
    permissions: [0, 1, 2, 3, 99, 100],
  },
  {
    path: '/account-settings',
    name: 'Account Settings',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: Dashboard,
    configKey: 'accountSettings',
    permissions: [0, 1, 2, 3, 99, 100],
  },
  {
    path: '/',
    name: 'Dashboard',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: Dashboard,
    permissions: [0, 1, 2, 3, 99, 100],
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

    // b2b user
    if (!isB2BUser || (role === 3 && !isAgenting)) {
      return permissions.includes(99)
    }

    if (!permissions.includes(+role || 0) || !storefrontConfig) {
      return false
    }

    if ((configKey === 'quotes' || configKey === 'quoteDraft') && !productQuoteEnabled && !cartQuoteEnabled) {
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

export {
  getAllowedRoutes,
  routes,
}
