import { lazy, useContext, useEffect, useState } from 'react'
import { HashRouter } from 'react-router-dom'

import GlobalDialog from '@/components/extraTip/GlobalDialog'
import B3RenderRouter from '@/components/layout/B3RenderRouter'
import showPageMask from '@/components/loadding/B3showPageMask'
import { useSetOpen } from '@/hooks'
import useDomHooks from '@/hooks/dom/useDomHooks'
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
  isUserGotoLogin,
  loginInfo,
  openPageByClick,
  removeBCMenus,
  setStorefrontConfig,
} from '@/utils'

import { useB3AppOpen } from './hooks/useB3AppOpen'
import { getCompanyInfo } from './utils/loginInfo'
import {
  setGlabolCommonState,
  setOpenPageReducer,
  useAppDispatch,
  useAppSelector,
} from './store'

const B3GlobalTip = lazy(() => import('@/components/B3GlobalTip'))

const B3HoverButton = lazy(
  () => import('@/components/outSideComponents/B3HoverButton')
)

const B3MasquradeGobalTip = lazy(
  () => import('@/components/outSideComponents/B3MasquradeGobalTip')
)

const HeadlessController = lazy(() => import('@/components/HeadlessController'))

const ThemeFrame = lazy(() => import('@/components/ThemeFrame'))

const FONT_URL =
  'https://fonts.googleapis.com/css?family=Roboto:300,400,500,700&display=swap'

export default function App() {
  const {
    state: {
      isB2BUser,
      B3UserId,
      currentChannelId,
      quoteConfig,
      storefrontConfig,
      productQuoteEnabled,
      registerEnabled,
    },
    dispatch,
  } = useContext(GlobaledContext)

  const storeDispatch = useAppDispatch()
  const isAgenting = useAppSelector(
    ({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting
  )
  const customerId = useAppSelector(({ company }) => company.customer.id)
  const emailAddress = useAppSelector(
    ({ company }) => company.customer.emailAddress
  )
  const role = useAppSelector((state) => state.company.customer.role)
  const isClickEnterBtn = useAppSelector(({ global }) => global.isClickEnterBtn)
  const isPageComplete = useAppSelector(({ global }) => global.isPageComplete)
  const currentClickedUrl = useAppSelector(
    ({ global }) => global.currentClickedUrl
  )
  const isRegisterAndLogin = useAppSelector(
    ({ global }) => global.isRegisterAndLogin
  )

  const handleAccountClick = (href: string, isRegisterAndLogin: boolean) => {
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

  const loginAndRegister = () => {
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
  }

  const gotoPage = (url: string) => {
    setOpenPage({
      isOpen: true,
      openUrl: url,
    })
  }

  useEffect(() => {
    handleHideRegisterPage(registerEnabled)
  }, [registerEnabled])

  useEffect(() => {
    removeBCMenus()
  }, [])

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
        getCompanyInfo(B3UserId, role),
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
        await gotoAllowedAppPage(+userInfo.role, gotoPage)
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
    // ignore dispatch, gotoPage, loginAndRegister, setOpenPage, storeDispatch, styleDispatch
    // due they are funtions that do not depend on any reactive value
    // ignore href because is not a reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    B3UserId,
    currentChannelId,
    customerId,
    emailAddress,
    isAgenting,
    isB2BUser,
    role,
  ])

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
      setTimeout(() => {
        window.b2b.initializationEnvironment.isInit = true
      })
    }
    // ignore dispatch due it's funtion that doesn't not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isB2BUser, isAgenting, role, quoteConfig, storefrontConfig])

  useEffect(() => {
    if (isOpen) {
      showPageMask(dispatch, false)
    }
    // ignore dispatch due it's funtion that doesn't not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    const init = async () => {
      if (isClickEnterBtn && isPageComplete && currentClickedUrl) {
        // graphql bc

        const gotoUrl = openPageByClick({
          href: currentClickedUrl,
          role,
          isRegisterAndLogin,
          isAgenting,
        })

        const isGotoLogin = await isUserGotoLogin(gotoUrl)

        setOpenPage({
          isOpen: true,
          openUrl: isGotoLogin ? '/login' : gotoUrl,
        })

        showPageMask(dispatch, false)
        storeDispatch(
          setGlabolCommonState({
            isClickEnterBtn: false,
          })
        )
      }
    }

    init()
    // ignore dispatch, setOpenPage, and storeDispatch
    // due they are funtions that do not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentClickedUrl,
    isAgenting,
    isClickEnterBtn,
    isPageComplete,
    isRegisterAndLogin,
    role,
  ])

  useEffect(() => {
    const { hash } = window.location

    if (!hash.includes('login') && !hash.includes('register')) {
      const recordOpenHash = isOpen ? hash : ''
      storeDispatch(
        setGlabolCommonState({
          recordOpenHash,
        })
      )
    }

    if (isOpen && hash === '#/') {
      setOpenPage({
        isOpen: false,
        openUrl: '',
      })
    }
    // ignore setOpenPage ad storeDispatch
    // due they are funtions that do not depend on any reactive value
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen])

  useEffect(() => {
    const cssValue = (cssOverride.css || '').replace(/\};/g, '}')

    const newStyle = `${CUSTOM_STYLES}\n${cssValue}`

    setCustomStyle(newStyle)
  }, [cssOverride?.css, CUSTOM_STYLES])

  return (
    <>
      <HashRouter>
        <div className="bundle-app">
          <ThemeFrame
            className={isOpen ? 'active-frame' : undefined}
            fontUrl={FONT_URL}
            customStyles={customStyles}
          >
            {isOpen ? (
              <B3RenderRouter
                isOpen={isOpen}
                openUrl={openUrl}
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
      <HeadlessController setOpenPage={setOpenPage} />
      <B3GlobalTip />
      <GlobalDialog />
    </>
  )
}
