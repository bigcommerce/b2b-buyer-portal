import {
  useEffect,
  lazy,
  Suspense,
  useContext,
} from 'react'

import {
  Box,
} from '@mui/material'

import {
  HashRouter,
  Route,
  Routes,
  Outlet,
} from 'react-router-dom'
import {
  useB3AppOpen,
} from '@b3/hooks'

import {
  useB3Lang,
} from '@b3/lang'

import globalB3 from '@b3/global-b3'

import {
  getCustomerInfo,
} from '@/shared/service/bc'

import {
  getB2BCompanyUserInfo,
} from '@/shared/service/b2b'

import {
  B3SStorage,
} from '@/utils'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  Layout,
  RegisteredCloseButton,
  ThemeFrame,
} from '@/components'
import {
  RegisteredProvider,
} from '@/pages/registered/context/RegisteredContext'

const FONT_URL = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap'
const CUSTOM_STYLES = `
body {
  background: #acacac;
  font-family: Roboto;
};
`

const {
  height: defaultHeight,
  overflow: defaultOverflow,
} = document.body.style

const Home = lazy(() => import('./pages/Home'))

const Form = lazy(() => import('./pages/Form'))

const Registered = lazy(() => import('./pages/registered/Registered'))

const RegisteredBCToB2B = lazy(() => import('./pages/registered/RegisteredBCToB2B'))

const Login = lazy(() => import('./pages/login/Login'))

const Order = lazy(() => import('./pages/order/Order'))

const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))

const ForgotPassword = lazy(() => import('./pages/login/ForgotPassword'))

export default function App() {
  const [{
    isOpen,
    openUrl,
  }, setOpenPage] = useB3AppOpen({
    isOpen: false,
  })

  const b3Lang = useB3Lang()

  const {
    state: {
      isB2BUser,
      isLogin,
      customerId,
    },
    dispatch,
  } = useContext(GlobaledContext)

  useEffect(() => {
    if (isOpen) {
      document.body.style.height = '100%'
      document.body.style.overflow = 'hidden'
      if (openUrl) {
        const {
          origin,
          pathname,
          search,
        } = window.location
        window.location.href = `${origin}${pathname}${search}#${openUrl}`
      }
    } else {
      document.body.style.height = defaultHeight
      document.body.style.overflow = defaultOverflow
    }
  }, [isOpen])

  const getCurrentCustomerInfo = async () => {
    try {
      const {
        data: {
          customer: {
            entityId: customerId,
            phone: phoneNumber,
            firstName,
            lastName,
            email: emailAddress = '',
          },
        },
      } = await getCustomerInfo()

      const {
        companyUserInfo: {
          userType,
          userInfo: {
            role,
          },
        },
      } = await getB2BCompanyUserInfo(emailAddress)

      if (customerId) {
        B3SStorage.set('emailAddress', emailAddress)

        dispatch({
          type: 'common',
          payload: {
            isB2BUser: userType === 3,
            role,
            isLogin: true,
            customerId,
            customer: {
              phoneNumber,
              firstName,
              lastName,
              emailAddress,
            },
            emailAddress,
          },
        })
      }
    } catch (error) {
      // eslint-disable-next-line no-console
      console.log(error)
    }
  }

  useEffect(() => {
    const {
      pathname,
      href,
      search,
    } = window.location

    dispatch({
      type: 'common',
      payload: {
        isCheckout: pathname === '/checkout',
      },
    })

    if (/login.php/.test(pathname) && !href.includes('change_password')) {
      dispatch({
        type: 'common',
        payload: {
          isCloseGotoBCHome: true,
        },
      })

      let openUrl = '/login'
      if (/action=create_account/.test(search)) {
        openUrl = '/registered'
      }
      if (/action=reset_password/.test(search)) {
        openUrl = '/forgotpassword'
      }

      setOpenPage({
        isOpen: true,
        openUrl,
      })
    }

    getCurrentCustomerInfo()
  }, [])

  const createConvertB2BNavNode = () => {
    const convertB2BNavNode = document.createElement('li')
    convertB2BNavNode.className = 'navUser-item navUser-convert-b2b'
    convertB2BNavNode.innerHTML = `
      <a class="navUser-action" href="javascript:;" aria-label="Gift Certificates">
        ${b3Lang('intl.global.nav.registerB2B.linkText')}
      </a>
    `
    return convertB2BNavNode
  }

  useEffect(() => {
    if (isLogin && !isB2BUser && customerId) {
      // already exist
      if (document.querySelector('.navUser-item.navUser-convert-b2b')) {
        return
      }

      const convertB2BNavNode = createConvertB2BNavNode()
      const accountNode = document.querySelector(globalB3['dom.navUserLoginElement'])
      accountNode?.parentNode?.insertBefore(convertB2BNavNode, accountNode)

      const linkNode = convertB2BNavNode.querySelector('a')
      if (linkNode) {
        linkNode.onclick = () => {
          setOpenPage({
            isOpen: true,
            openUrl: '/registeredbctob2b',
          })
        }
      }
    } else {
      document.querySelector('.navUser-item.navUser-convert-b2b')?.remove()
    }
  }, [isB2BUser, isLogin, customerId])

  return (
    <HashRouter>
      <div className="bundle-app">
        <ThemeFrame
          className={isOpen ? 'active-frame' : undefined}
          fontUrl={FONT_URL}
          customStyles={CUSTOM_STYLES}
        >

          {isOpen ? (
            <Suspense fallback={(
              <Box sx={{
                display: 'flex',
                width: '100%',
                height: '100vh',
                justifyContent: 'center',
                alignItems: 'center',
              }}
              >
                Loading...
              </Box>
            )}
            >
              <Routes>
                <Route
                  path="/"
                  element={(
                    <Layout>
                      <RegisteredCloseButton setOpenPage={setOpenPage} />
                      <Outlet />
                    </Layout>
                )}
                >
                  <Route
                    path="/"
                    element={<Home />}
                  />
                  <Route
                    path="form"
                    element={<Form />}
                  />
                  <Route
                    path="login"
                    element={<Login />}
                  />
                  <Route
                    path="forgotpassword"
                    element={<ForgotPassword />}
                  />
                  <Route
                    path="registeredbctob2b"
                    element={(
                      <RegisteredProvider>
                        <RegisteredBCToB2B setOpenPage={setOpenPage} />
                      </RegisteredProvider>
                    )}
                  />
                  <Route
                    path="registered"
                    element={(
                      <RegisteredProvider>
                        <Registered setOpenPage={setOpenPage} />
                      </RegisteredProvider>
                    )}
                  />
                  <Route
                    path="order"
                    element={<Order />}
                  />
                  <Route
                    path="dashboard"
                    element={<Dashboard />}
                  />
                </Route>
              </Routes>
            </Suspense>
          ) : null}
        </ThemeFrame>
      </div>
    </HashRouter>
  )
}
