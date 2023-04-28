import { useCallback, useContext, useEffect } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import { useB3AppOpen } from '@b3/hooks'

import {
  B3GlobalTip,
  B3HoverButton,
  B3MasquradeGobalTip,
  B3RenderRouter,
  showPageMask,
  ThemeFrame,
} from '@/components'
import { useDomHooks, useSetOpen } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import { gotoAllowedAppPage } from '@/shared/routes'
import { setChannelStoreType } from '@/shared/service/b2b'
import {
  getCurrentCustomerInfo,
  getQuoteEnabled,
  getStoreTaxZoneRates,
  getTemPlateConfig,
  loginInfo,
  setStorefrontConfig,
} from '@/utils'

import { globalStateSelector, setGlabolCommonState } from './store'

const FONT_URL =
  'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap'

export default function App() {
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
      // showPageMask
    },
    dispatch,
  } = useContext(GlobaledContext)

  const storeDispatch = useDispatch()

  const { isClickEnterBtn, isPageComplete } = useSelector(globalStateSelector)

  const handleAccountClick = () => {
    showPageMask(dispatch, true)
    storeDispatch(
      setGlabolCommonState({
        isClickEnterBtn: true,
      })
    )
  }

  const [{ isOpen, openUrl, params }, setOpenPage] = useB3AppOpen({
    isOpen: false,
    isPageComplete,
    handleEnterClick: handleAccountClick,
  })

  const {
    state: {
      portalStyle: { backgroundColor },
    },
    dispatch: styleDispatch,
  } = useContext(CustomStyleContext)

  const CUSTOM_STYLES = `
  body {
    background: ${backgroundColor};
    font-family: Roboto;
  };`
  // const [openApp, setOpenApp] = useState<boolean>(false)

  useDomHooks({ setOpenPage })

  // Button to open storefront
  useSetOpen(isOpen, openUrl, params)

  const { pathname, href, search } = window.location

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
      // await getTaxZoneRates()
      await Promise.all([
        getStoreTaxZoneRates(),
        setStorefrontConfig(dispatch, currentChannelId),
        getTemPlateConfig(currentChannelId, styleDispatch, dispatch),
      ])
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
      if (
        !href.includes('checkout') &&
        !(customerId && !window.location.hash)
      ) {
        gotoAllowedAppPage(+userInfo.role, gotoPage)
      }

      sessionStorage.removeItem('isReLogin')
      showPageMask(dispatch, false)
      storeDispatch(
        setGlabolCommonState({
          isPageComplete: true,
        })
      )
    }

    init()
  }, [])

  useEffect(() => {
    if (quoteConfig.length > 0 && storefrontConfig) {
      const { productQuoteEnabled, cartQuoteEnabled, shoppingListEnabled } =
        getQuoteEnabled(
          quoteConfig,
          storefrontConfig,
          role,
          isB2BUser,
          isAgenting
        )

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

  useEffect(() => {
    if (isOpen) {
      showPageMask(dispatch, false)
    }
  }, [isOpen])

  useEffect(() => {
    if (isClickEnterBtn && isPageComplete) {
      gotoAllowedAppPage(+role, gotoPage, true)
      storeDispatch(
        setGlabolCommonState({
          isClickEnterBtn: false,
        })
      )
    }
  }, [isPageComplete])

  useEffect(() => {
    const handleHashChange = () => {
      const { hash } = window.location
      if (!isOpen && hash) {
        const url = hash.split('#')[1]
        if (url !== '/') {
          setOpenPage({
            isOpen: true,
            openUrl: url,
          })
        }
      }
    }
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

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
      <B3MasquradeGobalTip setOpenPage={setOpenPage} isOpen={isOpen} />
      <B3HoverButton
        isOpen={isOpen}
        productQuoteEnabled={productQuoteEnabled}
        setOpenPage={setOpenPage}
      />
      <B3GlobalTip />
    </>
  )
}
