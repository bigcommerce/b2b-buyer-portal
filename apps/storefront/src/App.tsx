import {
  useEffect,
  useContext,
} from 'react'

import {
  HashRouter,
} from 'react-router-dom'
import {
  useB3AppOpen,
} from '@b3/hooks'

import {
  useOpenPDP,
  useRefresh,
  useRegisteredbctob2b,
} from '@/hooks'

import {
  loginInfo,
  getCurrentCustomerInfo,
  getLogo,
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
    },
    dispatch,
  } = useContext(GlobaledContext)

  useOpenPDP({
    setOpenPage,
    isB2BUser,
    role,
  })

  useRefresh(isOpen, openUrl)

  const setLogo = async () => {
    const {
      quoteConfig,
    } = await getB2BRegisterLogo()
    const logo = getLogo(quoteConfig)

    dispatch({
      type: 'common',
      payload: {
        logo,
      },
    })
  }

  const setStorefrontConfig = async () => {
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
  }

  const loginAndRegister = () => {
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
  }

  useEffect(() => {
    const {
      hash,
    } = window.location
    loginAndRegister()

    const gotoPage = (role?: number) => {
      let url = hash.split('#')[1]

      if (!url) url = role === 3 ? '/' : '/orders'

      setOpenPage({
        isOpen: true,
        openUrl: url,
      })
    }

    const init = async () => {
      // bc token
      if (!BcToken) {
        await loginInfo()
      }

      if (!logo) {
        setLogo()
      }
      setStorefrontConfig()
      setChannelStoreType(bcChannelId)
      if (!customerId) {
        const data = await getCurrentCustomerInfo(dispatch)
        if (data) gotoPage(data.role)
      }
      if (customerId && hash) gotoPage()
    }

    init()
  }, [])

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
