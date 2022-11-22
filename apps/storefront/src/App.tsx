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
  useB3Lang,
} from '@b3/lang'

import globalB3 from '@b3/global-b3'

import {
  getChannelId,
  loginInfo,
  getCurrentCustomerInfo,
  getLogo,
} from '@/utils'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  getB2BRegisterLogo,
} from '@/shared/service/b2b'

import {
  ThemeFrame,
  B3RenderRouter,
} from '@/components'

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
      customerId,
      BcToken,
    },
    dispatch,
  } = useContext(GlobaledContext)

  // const navigate = useNavigate()

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

  useEffect(() => {
    const {
      pathname,
      href,
      search,
      hash,
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

    const init = async () => {
      // bc token
      if (!BcToken) {
        await getChannelId()
        await loginInfo()
      }
      if (!customerId) {
        await getCurrentCustomerInfo(dispatch)
      } else if (hash) {
        const url = hash.split('#')[1]
        setOpenPage({
          isOpen: true,
          openUrl: url,
        })
      }
    }

    init()
  }, [])

  useEffect(() => {
    const init = async () => {
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

    init()
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
    if (!isB2BUser && customerId) {
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
  }, [isB2BUser, customerId])

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
