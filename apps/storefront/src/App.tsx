import {
  useEffect,
  useContext,
  useCallback,
} from 'react'

import {
  HashRouter,
} from 'react-router-dom'
import {
  useB3AppOpen,
} from '@b3/hooks'

import {
  useOpenPDP,
  useSetOpen,
  useMyQuote,
  useRegisteredbctob2b,
  useCartToQuote,
} from '@/hooks'

import {
  loginInfo,
  getCurrentCustomerInfo,
  getQuoteEnabled,
  showPageMask,
} from '@/utils'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  getB2BRegisterLogo,
  getStorefrontConfig,
  setChannelStoreType,
} from '@/shared/service/b2b'

import {
  ThemeFrame,
  B3RenderRouter,
  B3MasquradeGobalTip,
  B3HoverButton,
  // CheckoutTip,
} from '@/components'

import {
  gotoAllowedAppPage,
} from '@/shared/routes'

const FONT_URL = 'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap'
const CUSTOM_STYLES = `
body {
  background: #fef9f5 !important;
  font-family: Roboto;
};
`
export default function App() {
  const [{
    isOpen,
    openUrl,
    params,
  }, setOpenPage] = useB3AppOpen({
    isOpen: false,
  })

  const {
    state: {
      isB2BUser,
      customerId,
      BcToken,
      role,
      currentChannelId,
      isAgenting,
      quoteConfig,
      storefrontConfig,
      productQuoteEnabled,
      cartQuoteEnabled,
      shoppingListEnabled,
      B3UserId,
    },
    dispatch,
  } = useContext(GlobaledContext)

  // const [openApp, setOpenApp] = useState<boolean>(false)

  useOpenPDP({
    setOpenPage,
    isB2BUser,
    shoppingListEnabled,
  })

  useMyQuote({
    setOpenPage,
    productQuoteEnabled,
    B3UserId,
    role,
  })
  useCartToQuote({
    setOpenPage,
    cartQuoteEnabled,
  })

  // Button to open storefront
  useSetOpen(isOpen, openUrl, params)

  const getQuoteConfig = useCallback(async () => {
    const {
      quoteConfig,
    } = await getB2BRegisterLogo()

    dispatch({
      type: 'common',
      payload: {
        quoteConfig,
      },
    })
  }, [])

  const setStorefrontConfig = useCallback(async () => {
    const {
      storefrontConfig: {
        config: storefrontConfig,
      },
    } = await getStorefrontConfig()

    dispatch({
      type: 'common',
      payload: {
        storefrontConfig,
      },
    })
  }, [])

  const {
    pathname,
    href,
    search,
  } = window.location

  const loginAndRegister = useCallback(() => {
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
  }, [])

  const gotoPage = useCallback((url: string) => {
    setOpenPage({
      isOpen: true,
      openUrl: url,
    })
  }, [])

  useEffect(() => {
    const isRelogin = sessionStorage.getItem('isReLogin') === 'true'
    loginAndRegister()
    const init = async () => {
      // bc token
      if (!BcToken || isRelogin) {
        await loginInfo()
      }

      setChannelStoreType(currentChannelId)
      await Promise.all([getQuoteConfig(), setStorefrontConfig()])

      const userInfo = {
        role: +role,
        isAgenting,
      }

      if (!customerId || isRelogin) {
        const info = await getCurrentCustomerInfo(dispatch)
        if (info) {
          userInfo.role = info?.role
        }
      }

      // background login enter judgment and refresh
      if (!href.includes('checkout') && !(customerId && !window.location.hash)) {
        gotoAllowedAppPage(+userInfo.role, gotoPage)
      }

      sessionStorage.removeItem('isReLogin')
      showPageMask(false)
    }

    init()
  }, [])

  // useEffect(() => {
  //   if (openApp) {
  //     gotoAllowedAppPage(+role, gotoPage)
  //     showPageMask(false)
  //   }
  // }, [openApp])

  useEffect(() => {
    if (quoteConfig.switchStatus.length > 0 && storefrontConfig) {
      const {
        productQuoteEnabled,
        cartQuoteEnabled,
        shoppingListEnabled,
      } = getQuoteEnabled(quoteConfig, storefrontConfig, role, isB2BUser, isAgenting)

      dispatch({
        type: 'common',
        payload: {
          productQuoteEnabled,
          cartQuoteEnabled,
          shoppingListEnabled,
        },
      })
    }
  }, [isB2BUser, isAgenting, role, quoteConfig, storefrontConfig])

  useRegisteredbctob2b(setOpenPage, isB2BUser, customerId)

  useEffect(() => {
    if (isOpen) {
      showPageMask(false)
    }
  }, [isOpen])

  return (
    <>
      <HashRouter>
        <div className="bundle-app">
          <ThemeFrame
            className={isOpen ? 'active-frame' : undefined}
            fontUrl={FONT_URL}
            customStyles={CUSTOM_STYLES}
          >

            {isOpen ? (
              <B3RenderRouter
                openUrl={openUrl}
                isOpen={isOpen}
                setOpenPage={setOpenPage}
              />
            ) : null}
          </ThemeFrame>
        </div>

      </HashRouter>
      <B3MasquradeGobalTip
        setOpenPage={setOpenPage}
        isOpen={isOpen}
      />
      <B3HoverButton
        isOpen={isOpen}
        productQuoteEnabled={productQuoteEnabled}
        setOpenPage={setOpenPage}
      />
      {/* <CheckoutTip
        setOpenPage={setOpenPage}
      /> */}
    </>

  )
}
