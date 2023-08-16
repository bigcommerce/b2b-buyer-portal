import {
  lazy,
  Suspense,
  useCallback,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { HashRouter } from 'react-router-dom'
import { useB3AppOpen } from '@b3/hooks'

import B3RenderRouter from '@/components/layout/B3RenderRouter'
import showPageMask from '@/components/loadding/B3showPageMask'
import useDomHooks from '@/hooks/dom/useDomHooks'
import useSetOpen from '@/hooks/useSetOpen'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import { gotoAllowedAppPage } from '@/shared/routes'
import { setChannelStoreType } from '@/shared/service/b2b'
import {
  B3SStorage,
  clearInvoiceCart,
  getCompanyUserInfo,
  getCurrentCustomerInfo,
  getQuoteEnabled,
  getStoreTaxZoneRates,
  getTemPlateConfig,
  handleHideRegisterPage,
  loginInfo,
  openPageByClick,
  removeBCMenus,
  setStorefrontConfig,
} from '@/utils'

import { getCompanyInfo } from './utils/loginInfo'
import {
  globalStateSelector,
  setGlabolCommonState,
  setOpenPageReducer,
} from './store'

const B3GlobalTip = lazy(() => import('@/components/B3GlobalTip'))

const B3HoverButton = lazy(
  () => import('@/components/outSideComponents/B3HoverButton')
)

const B3MasquradeGobalTip = lazy(
  () => import('@/components/outSideComponents/B3MasquradeGobalTip')
)

const GlobalDialog = lazy(() => import('@/components/extraTip/GlobalDialog'))

const HeadlessController = lazy(() => import('@/components/HeadlessController'))

const Loading = lazy(() => import('@/components/loadding/Loading'))

const ThemeFrame = lazy(() => import('@/components/ThemeFrame'))

const FONT_URL =
  'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap'

export default function App() {
  const {
    state: {
      isB2BUser,
      customerId,
      role,
      realRole,
      B3UserId,
      currentChannelId,
      isAgenting,
      quoteConfig,
      storefrontConfig,
      productQuoteEnabled,
      emailAddress,
      registerEnabled,
    },
    dispatch,
  } = useContext(GlobaledContext)

  const storeDispatch = useDispatch()

  const {
    isClickEnterBtn,
    isPageComplete,
    currentClickedUrl,
    isRegisterAndLogin,
  } = useSelector(globalStateSelector)
  const [isClickBtn, setIsClickEnterBtn] = useState<boolean>(false)

  const handleAccountClick = (href: string, isRegisterAndLogin: boolean) => {
    setIsClickEnterBtn(!isClickBtn)
    showPageMask(dispatch, true)
    storeDispatch(
      setGlabolCommonState({
        isClickEnterBtn: true,
        currentClickedUrl: href,
        isRegisterAndLogin,
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
      cssOverride,
    },
    dispatch: styleDispatch,
  } = useContext(CustomStyleContext)

  const CUSTOM_STYLES = `
  body {
    background: ${backgroundColor};
    font-family: Roboto;
  }`

  const [customStyles, setCustomStyle] = useState<string>(CUSTOM_STYLES)

  useDomHooks({ setOpenPage, isOpen })

  // open storefront
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
        openUrl = '/register'
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
    handleHideRegisterPage(registerEnabled)
  }, [registerEnabled, storefrontConfig, window.location.pathname])

  useEffect(() => {
    removeBCMenus()
  }, [window.location.pathname, role])

  useEffect(() => {
    const isRelogin = sessionStorage.getItem('isReLogin') === 'true'
    storeDispatch(setOpenPageReducer(setOpenPage))
    loginAndRegister()
    const init = async () => {
      // bc graphql token
      const bcGraphqlToken = B3SStorage.get('bcGraphqlToken')
      if (!bcGraphqlToken || isRelogin) {
        await loginInfo()
      }
      setChannelStoreType(currentChannelId)
      // await getTaxZoneRates()

      await Promise.all([
        getStoreTaxZoneRates(),
        setStorefrontConfig(dispatch, currentChannelId),
        getTemPlateConfig(currentChannelId, styleDispatch, dispatch),
        getCompanyUserInfo(emailAddress, dispatch, customerId, isB2BUser),
        getCompanyInfo(B3UserId, realRole),
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

      if (customerId) {
        clearInvoiceCart()
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
      const {
        productQuoteEnabled,
        cartQuoteEnabled,
        shoppingListEnabled,
        registerEnabled,
      } = getQuoteEnabled(
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
          registerEnabled,
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
    if (isClickEnterBtn && isPageComplete && currentClickedUrl) {
      const gotoUrl = openPageByClick({
        href: currentClickedUrl,
        role,
        isRegisterAndLogin,
        isAgenting,
      })

      setOpenPage({
        isOpen: true,
        openUrl: gotoUrl,
      })

      showPageMask(dispatch, false)
      storeDispatch(
        setGlabolCommonState({
          isClickEnterBtn: false,
        })
      )
    }
  }, [isPageComplete, currentClickedUrl, isClickBtn])

  useEffect(() => {
    const handleHashChange = () => {
      const { hash } = window.location
      if (hash) {
        const url = hash.split('#')[1]
        if (url && url !== '/') {
          setOpenPage({
            isOpen: true,
            openUrl: url,
          })
          return
        }
      }

      setOpenPage({
        isOpen: false,
        openUrl: '',
      })
    }
    window.addEventListener('hashchange', handleHashChange)

    return () => {
      window.removeEventListener('hashchange', handleHashChange)
    }
  }, [])

  useEffect(() => {
    const { hash } = window.location

    if (isOpen && hash === '#/') {
      setOpenPage({
        isOpen: false,
        openUrl: '',
      })
    }
  }, [isOpen])

  useEffect(() => {
    const cssValue = (cssOverride.css || '').replace(/\};/g, '}')

    const newStyle = `${CUSTOM_STYLES}\n${cssValue}`

    setCustomStyle(newStyle)
  }, [cssOverride, window.location.href])

  return (
    <>
      <HashRouter>
        <div className="bundle-app">
          <Suspense fallback={<Loading />}>
            <ThemeFrame
              className={isOpen ? 'active-frame' : undefined}
              fontUrl={FONT_URL}
              customStyles={customStyles}
              isOpen={isOpen}
            >
              {isOpen ? (
                <B3RenderRouter openUrl={openUrl} setOpenPage={setOpenPage} />
              ) : null}
            </ThemeFrame>
          </Suspense>
        </div>
      </HashRouter>
      <B3MasquradeGobalTip setOpenPage={setOpenPage} isOpen={isOpen} />
      <B3HoverButton
        isOpen={isOpen}
        productQuoteEnabled={productQuoteEnabled}
        setOpenPage={setOpenPage}
      />
      <HeadlessController setOpenPage={setOpenPage} />
      <B3GlobalTip />
      <GlobalDialog />
    </>
  )
}
