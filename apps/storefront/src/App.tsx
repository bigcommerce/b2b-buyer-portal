import {
  useEffect,
  useContext,
  useState,
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
} from '@/hooks'

import {
  loginInfo,
  getCurrentCustomerInfo,
  getLogo,
  getQuoteEnabled,
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
  }, setOpenPage] = useB3AppOpen({
    isOpen: false,
  })

  const {
    state: {
      isB2BUser,
      customerId,
      BcToken,
      role,
      logo,
      bcChannelId,
      isAgenting,
      quoteConfig,
      storefrontConfig,
      productQuoteEnabled,
      cartQuoteEnabled,
    },
    dispatch,
  } = useContext(GlobaledContext)

  const [openApp, setOpenApp] = useState<boolean>(false)

  useOpenPDP({
    setOpenPage,
    isB2BUser,
    role,
  })

  useMyQuote({
    setOpenPage,
    productQuoteEnabled,
    cartQuoteEnabled,
  })
  // Button to open storefront
  useSetOpen(isOpen, openUrl)

  const getQuoteConfig = useCallback(async () => {
    const {
      quoteConfig,
    } = await getB2BRegisterLogo()
    const quoteLogo = getLogo(quoteConfig)

    dispatch({
      type: 'common',
      payload: {
        logo: logo || quoteLogo,
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

  const loginAndRegister = useCallback(() => {
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
  }, [])

  const gotoPage = useCallback((url: string) => {
    setOpenPage({
      isOpen: true,
      openUrl: url,
    })
  }, [])

  useEffect(() => {
    loginAndRegister()
    const init = async () => {
      // bc token
      if (!BcToken) {
        await loginInfo()
      }

      setChannelStoreType(bcChannelId)
      await Promise.all([getQuoteConfig(), setStorefrontConfig()])

      if (!customerId) await getCurrentCustomerInfo(dispatch)

      // background login enter judgment
      setOpenApp(!(customerId && !window.location.hash))
    }

    init()
  }, [])

  useEffect(() => {
    if (openApp) gotoAllowedAppPage(+role, gotoPage)
  }, [openApp])

  useEffect(() => {
    if (quoteConfig.switchStatus.length > 0 && storefrontConfig) {
      const {
        productQuoteEnabled,
        cartQuoteEnabled,
      } = getQuoteEnabled(quoteConfig, storefrontConfig, role, isB2BUser, isAgenting)

      dispatch({
        type: 'common',
        payload: {
          productQuoteEnabled,
          cartQuoteEnabled,
        },
      })
    }
  }, [isB2BUser, isAgenting, role, quoteConfig, storefrontConfig])

  useRegisteredbctob2b(setOpenPage, isB2BUser, customerId)

  return (
    <HashRouter>
      <div className="bundle-app">
        <ThemeFrame
          className={isOpen ? 'active-frame' : undefined}
          fontUrl={FONT_URL}
          customStyles={CUSTOM_STYLES}
        >

          {isOpen ? (
            <B3RenderRouter setOpenPage={setOpenPage} />
          ) : null}
        </ThemeFrame>
      </div>

    </HashRouter>
  )
}
