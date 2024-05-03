import { lazy } from 'react'
import { matchPath } from 'react-router-dom'

import { GlobalState, QuoteConfigProps } from '@/shared/global/context/config'
import { getCustomerInfo } from '@/shared/service/bc'
import { store, useAppSelector } from '@/store'
import { CompanyStatus, CustomerRole, UserTypes } from '@/types'
import b2bLogger from '@/utils/b3Logger'
import { isB2bTokenPage, logoutSession } from '@/utils/b3logout'

const OrderList = lazy(() => import('../../pages/order/MyOrder'))

const CompanyOrderList = lazy(() => import('../../pages/order/CompanyOrder'))

const Dashboard = lazy(() => import('../../pages/dashboard/Dashboard'))

const OrderDetail = lazy(() => import('../../pages/orderDetail/OrderDetail'))

const InvoiceDetail = lazy(
  () => import('../../pages/invoiceDetail/InvoiceDetail')
)

const Usermanagement = lazy(
  () => import('../../pages/usermanagement/Usermanagement')
)

const AddressList = lazy(() => import('../../pages/address/Address'))

const ShippingLists = lazy(
  () => import('../../pages/shoppingLists/ShoppingLists')
)

const QuoteDraft = lazy(() => import('../../pages/quote/QuoteDraft'))
const Quotes = lazy(() => import('../../pages/quote/QuotesList'))
const QuoteDetail = lazy(() => import('../../pages/quote/QuoteDetail'))

const AccountSetting = lazy(
  () => import('../../pages/accountSetting/AccountSetting')
)
const ShoppingListDetails = lazy(
  () => import('../../pages/shoppingListDetails/ShoppingListDetails')
)

const Registered = lazy(() => import('../../pages/registered/Registered'))

const RegisteredBCToB2B = lazy(
  () => import('../../pages/registered/RegisteredBCToB2B')
)

const Login = lazy(() => import('../../pages/login/Login'))

const ForgotPassword = lazy(() => import('../../pages/login/ForgotPassword'))

const PDP = lazy(() => import('../../pages/pdp/PDP'))

const Quickorder = lazy(() => import('../../pages/quickorder/Quickorder'))

const HomePage = lazy(() => import('../../pages/homePage/HomePage'))

const Invoice = lazy(() => import('../../pages/invoice/Invoice'))

const InvoicePayment = lazy(() => import('../../pages/invoice/Payment'))

type RegisteredItem = typeof Registered | typeof HomePage

interface RouteItemBasic {
  path: string
  name: string
  permissions: number[] // 0: admin, 1: senior buyer, 2: junior buyer, 3: salesRep, 4: salesRep-【Not represented】, 99: bc user, 100: guest
}

export interface RouteItem extends RouteItemBasic {
  component: RegisteredItem
  isMenuItem: boolean
  wsKey: string
  configKey?: string
  isTokenLogin: boolean
  pageTitle?: string
  idLang: string
}

export interface RouteFirstLevelItem extends RouteItemBasic {
  isProvider: boolean
  component: RegisteredItem
}

const routes: RouteItem[] = [
  {
    path: '/dashboard',
    name: 'Dashboard',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: Dashboard,
    permissions: [3, 4],
    isTokenLogin: true,
    idLang: 'global.navMenu.dashboard',
  },
  {
    path: '/orders',
    name: 'My orders',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: OrderList,
    permissions: [0, 1, 3, 4, 99, 100],
    isTokenLogin: true,
    idLang: 'global.navMenu.orders',
  },
  {
    path: '/company-orders',
    name: 'Company orders',
    wsKey: 'router-orders',
    isMenuItem: true,
    component: CompanyOrderList,
    permissions: [0, 1, 3],
    isTokenLogin: true,
    idLang: 'global.navMenu.companyOrders',
  },
  {
    path: '/invoice',
    name: 'Invoice',
    wsKey: 'invoice',
    isMenuItem: true,
    component: Invoice,
    configKey: 'invoice',
    permissions: [0, 1, 3],
    isTokenLogin: true,
    idLang: 'global.navMenu.invoice',
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
    idLang: 'global.navMenu.quotes',
  },
  {
    path: '/shoppingLists',
    name: 'Shopping lists',
    wsKey: 'shioppingLists',
    isMenuItem: true,
    component: ShippingLists,
    configKey: 'shoppingLists',
    permissions: [0, 1, 2, 3, 99],
    isTokenLogin: true,
    idLang: 'global.navMenu.shoppingLists',
  },
  {
    path: '/purchased-products',
    name: 'Quick order',
    pageTitle: 'Purchased products',
    wsKey: 'quickorder',
    isMenuItem: true,
    component: Quickorder,
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
    component: OrderDetail,
    permissions: [0, 1, 2, 3, 4, 99, 100],
    isTokenLogin: true,
    idLang: 'global.navMenu.orderDetail',
  },
  {
    path: '/invoiceDetail/:id',
    name: 'Invoice details',
    wsKey: 'router-invoice',
    isMenuItem: false,
    component: InvoiceDetail,
    permissions: [0, 1, 3, 99, 100],
    isTokenLogin: true,
    idLang: 'global.navMenu.invoiceDetail',
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
    idLang: 'global.navMenu.addresses',
  },
  {
    path: '/shoppingList/:id',
    name: 'Shopping list',
    wsKey: 'router-shopping-list',
    isMenuItem: false,
    component: ShoppingListDetails,
    permissions: [0, 1, 2, 3, 99],
    isTokenLogin: true,
    idLang: 'global.navMenu.shoppingList',
  },
  {
    path: '/user-management',
    name: 'User management',
    wsKey: 'router-userManagement',
    isMenuItem: true,
    component: Usermanagement,
    permissions: [0, 1, 3],
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
    permissions: [0, 1, 2, 3, 4, 99, 100],
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
    permissions: [0, 1, 2, 3, 4, 99],
    isTokenLogin: true,
    idLang: 'global.navMenu.accountSettings',
  },
  {
    path: '/quoteDetail/:id',
    name: 'Quote detail',
    wsKey: 'quoteDetail',
    isMenuItem: false,
    component: QuoteDetail,
    configKey: 'quoteDetail',
    permissions: [0, 1, 2, 3, 4, 99, 100],
    isTokenLogin: false,
    idLang: 'global.navMenu.quoteDetail',
  },
]

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
    path: '/forgotpassword',
    name: 'forgotpassword',
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
]

const denyInvoiceRoles = [4, 99, 100]

const invoiceTypes = ['invoice?invoiceId', 'invoice?receiptId']

const getAllowedRoutes = (globalState: GlobalState): RouteItem[] => {
  const { storefrontConfig, quoteConfig } = globalState
  const { company } = store.getState()
  const { role } = company.customer
  let isB2BUser = false

  if (
    company.customer.userType === UserTypes.MULTIPLE_B2C &&
    company.companyInfo.status === CompanyStatus.APPROVED
  ) {
    isB2BUser = true
  } else if (+company.customer.role === CustomerRole.SUPER_ADMIN) {
    isB2BUser = true
  }

  return routes.filter((item: RouteItem) => {
    const { permissions = [] } = item
    const isAgenting = useAppSelector(
      ({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting
    )

    if (role === CustomerRole.SUPER_ADMIN && !isAgenting) {
      return permissions.includes(4)
    }

    // bc user
    if (!isB2BUser) {
      const navListKey =
        storefrontConfig && storefrontConfig[item.configKey || '']

      if (item.configKey === 'quotes') {
        if (role === CustomerRole.GUEST) {
          const quoteGuest =
            quoteConfig.find(
              (config: QuoteConfigProps) => config.key === 'quote_for_guest'
            )?.value || '0'
          return quoteGuest === '1' && navListKey
        }
        if (role === CustomerRole.B2C) {
          const quoteIndividualCustomer =
            quoteConfig.find(
              (config: QuoteConfigProps) =>
                config.key === 'quote_for_individual_customer'
            )?.value || '0'
          return quoteIndividualCustomer === '1' && navListKey
        }
      }
      if (item.configKey === 'shoppingLists') {
        const shoppingListOnProductPage = quoteConfig.find(
          (config: QuoteConfigProps) =>
            config.key === 'shopping_list_on_product_page'
        )?.extraFields
        if (role === CustomerRole.GUEST) {
          return shoppingListOnProductPage?.guest && navListKey
        }
        if (role === CustomerRole.B2C) {
          return shoppingListOnProductPage?.b2c && navListKey
        }
      }
      if (typeof navListKey === 'boolean') return navListKey
      return permissions.includes(CustomerRole.B2C)
    }

    if (
      !permissions.includes(+role || CustomerRole.ADMIN) ||
      !storefrontConfig
    ) {
      return false
    }

    if (item.configKey === 'quotes') {
      const quoteB2B =
        quoteConfig.find(
          (config: QuoteConfigProps) => config.key === 'quote_for_b2b'
        )?.value || '0'
      return storefrontConfig.quotes && quoteB2B === '1'
    }

    if (item.configKey === 'shoppingLists') {
      const shoppingListOnProductPage = quoteConfig.find(
        (config: QuoteConfigProps) =>
          config.key === 'shopping_list_on_product_page'
      )?.extraFields
      return storefrontConfig.shoppingLists && shoppingListOnProductPage?.b2b
    }

    if (item.configKey === 'quickOrderPad') {
      return storefrontConfig.quickOrderPad && storefrontConfig.buyAgain
    }
    const config = storefrontConfig[item.configKey || ''] ?? {
      enabledStatus: true,
    }
    if (typeof config === 'boolean') {
      return config
    }
    if (item.configKey === 'invoice') {
      return !!config.enabledStatus && !!config.value
    }

    return !!config.enabledStatus
  })
}

const gotoAllowedAppPage = async (
  role: CustomerRole,
  gotoPage: (url: string) => void,
  isAccountEnter?: boolean
) => {
  const { hash, pathname, href } = window.location
  const currentState = store.getState()
  const isLoggedIn =
    currentState.company.customer || role !== CustomerRole.GUEST
  if (!isLoggedIn) {
    gotoPage('/login?loginFlag=3&&closeIsLogout=1')
    return
  }

  const isInvoicePage = () =>
    invoiceTypes.some((type: string) => href.includes(type))

  if (denyInvoiceRoles.includes(role) && isInvoicePage()) {
    gotoPage('/login?loginFlag=7')
    return
  }
  try {
    const {
      data: { customer },
    } = await getCustomerInfo()

    if (!customer && isB2bTokenPage()) {
      logoutSession()
      gotoPage('/login?loginFlag=6')
      return
    }
  } catch (err: unknown) {
    b2bLogger.error(err)
  }

  let url = hash.split('#')[1] || ''
  if (
    (!url && role !== CustomerRole.GUEST && pathname.includes('account.php')) ||
    isAccountEnter
  )
    switch (role) {
      case CustomerRole.JUNIOR_BUYER:
        url = '/shoppingLists'
        break
      case CustomerRole.SUPER_ADMIN:
        url = '/dashboard'
        break
      default:
        url = '/orders'
        break
    }

  const flag = routes.some((item: RouteItem) => {
    if (matchPath(item.path, url) || isInvoicePage()) {
      return item.permissions.includes(role)
    }
    return false
  })

  const isFirstLevelFlag = firstLevelRouting.some(
    (item: RouteFirstLevelItem) => {
      if (url.includes('/login?') || url.includes('payment')) {
        return true
      }
      return matchPath(item.path, url)
    }
  )
  if (flag || isFirstLevelFlag) gotoPage(url)
}

const getIsTokenGotoPage = (url: string): boolean => {
  const flag = routes.some(
    (item: RouteItem) => matchPath(item.path, url) && !item.isTokenLogin
  )
  return flag
}

export {
  firstLevelRouting,
  getAllowedRoutes,
  getIsTokenGotoPage,
  gotoAllowedAppPage,
  routes,
}
