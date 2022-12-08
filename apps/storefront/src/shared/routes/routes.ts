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

const ShippingLists = lazy(() => import('../../pages/shippingLists/ShippingLists'))

// const AccountSetting = lazy(() => import('../../pages/accountSetting/AccountSetting'))
const AccountSetting = lazy(() => import('../../pages/dashboard/Dashboard'))

type OrderItem = typeof OrderList

export interface RouteItem {
  path: string,
  name: string,
  component: OrderItem,
  isMenuItem: boolean,
  wsKey: string,
  configKey?: string,
}

const routes: RouteItem[] = [
  {
    path: '/orders',
    name: 'My Orders',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: OrderList,
  },
  {
    path: '/company-orders',
    name: 'Company Orders',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: CompanyOrderList,
  },
  {
    path: '/orderDetail/:id',
    name: 'Order Details',
    wsKey: 'router-orders',
    isMenuItem: false,
    component: OrderDetail,
  },
  {
    path: '/invoiceDetail/:id',
    name: 'Invoice Details',
    wsKey: 'router-invoice',
    isMenuItem: false,
    component: InvoiceDetail,
  },
  {
    path: '/addresses',
    name: 'Addresses',
    wsKey: 'router-address',
    isMenuItem: true,
    component: AddressList,
    configKey: 'addressBook',
  },
  {
    path: '/user-management',
    name: 'User management',
    wsKey: 'router-userManagement',
    isMenuItem: true,
    component: Usermanagement,
  },
  {
    path: '/shippingLists',
    name: 'Shipping Lists',
    wsKey: 'shippingLists',
    isMenuItem: true,
    component: ShippingLists,
    configKey: 'shoppingLists',
  },
  {
    path: '/recently-viewed',
    name: 'Recently Viewed',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: Dashboard,
  },
  {
    path: '/account-settings',
    name: 'Account Settings',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: AccountSetting,
    configKey: 'accountSettings',
  },
  {
    path: '/',
    name: 'Dashboard',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: Dashboard,
  },
]

const getAllowedRoutes = (globalState: GlobalState): RouteItem[] => {
  const {
    isB2BUser,
    role,
    isAgenting,
    storefrontConfig,
  } = globalState

  return routes.filter((item: RouteItem) => {
    // bc user
    if (!isB2BUser || (role === 3 && !isAgenting)) {
      return item.path !== '/company-orders' && item.path !== '/user-management'
    }

    if (role === 2 && item.path === '/user-management') return false

    if (!storefrontConfig) {
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
