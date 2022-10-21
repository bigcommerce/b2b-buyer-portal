import {
  lazy,
} from 'react'

const OrderList = lazy(() => import('../../pages/order/Order'))

const Dashboard = lazy(() => import('../../pages/dashboard/Dashboard'))

type OrderItem = typeof OrderList

export interface RouteItem {
  path: string,
  name: string,
  component: OrderItem,
}

const routes = [
  {
    path: '/orders',
    name: 'Orders',
    wsKey: 'router-orders',
    component: OrderList,
  },
  {
    path: '/addresss',
    name: 'Addresss',
    wsKey: 'router-orders',
    component: Dashboard,
  },
  {
    path: '/recently-viewed',
    name: 'Recently Viewed',
    wsKey: 'router-orders',
    component: Dashboard,
  },
  {
    path: '/account-settings',
    name: 'Account Settings',
    wsKey: 'router-orders',
    component: Dashboard,
  },
  {
    path: '/',
    name: 'Dashboard',
    wsKey: 'router-orders',
    component: Dashboard,
  },
]

export {
  routes,
}
