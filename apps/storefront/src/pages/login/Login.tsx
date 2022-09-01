/* eslint-disable no-console */
import {
  useEffect,
  useState,
  useContext,
} from 'react'

import {
  ImageListItem,
  Box,
  Alert,
} from '@mui/material'

import {
  useB3Lang,
} from '@b3/lang'

import {
  useNavigate,
  useLocation,
} from 'react-router-dom'

import {
  getB2BRegisterLogo,
  getBCForcePasswordReset,
  getB2BLoginPageConfig,
} from '@/shared/service/b2b'

import {
  bcLogin,
  bcLogoutLogin,
} from '@/shared/service/bc'

import {
  getCurrentCustomerInfo,
} from '@/utils'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  LoginContainer, LoginImage,
} from './styled'

import {
  getLogo,
  LoginInfoInit,
  LoginConfig,
  loginCheckout,
  getLoginFlag,
} from './config'

import LoginWidget from './component/LoginWidget'

import LoginForm from './LoginForm'

import LoginPanel from './LoginPanel'

const initialLoginInfo = {
  loginTitle: 'Sign In',
  isShowWidgetHead: false,
  isShowWidgetBody: false,
  isShowWidgetFooter: false,
  loginBtn: 'Sing in',
  createAccountPanelTittle: 'Create Account Panel Title',
  CreateAccountButtonText: 'Create Account',
  btnColor: 'red',
  widgetHeadText: '',
  widgetBodyText: '',
  widgetFooterText: '',
  displayStoreLogo: false,
}

export default function Login() {
  const [isLoading, setLoading] = useState(true)

  const [logo, setLogo] = useState('')
  const [flag, setLoginFlag] = useState<string>('')
  const [loginAccount, setLoginAccount] = useState<LoginConfig>({
    emailAddress: '',
  })
  const location = useLocation()

  const [loginInfo, setLoginInfo] = useState<LoginInfoInit>(initialLoginInfo)

  const navigate = useNavigate()

  const b3Lang = useB3Lang()

  const {
    state: {
      isCheckout,
    },
    dispatch,
  } = useContext(GlobaledContext)

  useEffect(() => {
    const init = async () => {
      try {
        const {
          quoteConfig,
        } = await getB2BRegisterLogo()

        const {
          loginPageConfig: {
            value: {
              bottomHtmlRegionEnabled,
              bottomHtmlRegionHtml,
              createAccountPanelHtml,
              displayStoreLogo,
              pageTitle,
              primaryButtonColor,
              signInButtonText,
              createAccountButtonText,
              topHtmlRegionEnabled,
              topHtmlRegionHtml,
            },
          },
        } = await getB2BLoginPageConfig()

        const Info = {
          loginTitle: pageTitle,
          loginBtn: signInButtonText,
          CreateAccountButtonText: createAccountButtonText,
          btnColor: primaryButtonColor,
          isShowWidgetHead: topHtmlRegionEnabled,
          widgetHeadText: topHtmlRegionHtml,
          widgetBodyText: createAccountPanelHtml,
          isShowWidgetFooter: bottomHtmlRegionEnabled,
          widgetFooterText: bottomHtmlRegionHtml,
          displayStoreLogo,
        }

        const registerLogo = getLogo(quoteConfig)

        const {
          search,
        } = location

        const loginFlag = getLoginFlag(search, 'loginFlag')

        if (loginFlag) setLoginFlag(loginFlag)

        if (loginFlag === '3') {
          await bcLogoutLogin()

          dispatch({
            type: 'common',
            payload: {
              isCloseGotoBCHome: true,
            },
          })
        }

        // setChannelId(getChannelId)
        setLoginInfo(Info)
        setLogo(registerLogo)
        setLoading(false)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e)
      }
    }

    init()
  }, [])

  const tipInfo = (loginFlag: string, email = '') => {
    if (!loginFlag) return
    if (loginFlag) {
      let str = ''
      switch (loginFlag) {
        case '1':
          str = b3Lang('intl.user.login.loginTipInfo.resetPassword', {
            email,
          })
          break
        case '2':
          str = b3Lang('intl.user.login.loginTipInfo.receivePassword')
          break
        case '3':
          str = b3Lang('intl.user.login.loginTipInfo.loggedOutLogin')
          break
        case '4':
          str = b3Lang('intl.user.login.loginTipInfo.accountincorrect')
          break
        default:
          str = ''
      }
      return str
    }
  }

  const getforcePasswordReset = async (email: string) => {
    const {
      companyUserInfo: {
        userInfo: {
          forcePasswordReset,
        },
      },
    } = await getBCForcePasswordReset(email)

    if (forcePasswordReset) {
      setLoginFlag('1')
    } else {
      setLoginFlag('4')
    }
  }

  const handleLoginSubmit = async (data: LoginConfig) => {
    setLoading(true)
    setLoginAccount(data)

    if (isCheckout) {
      try {
        await loginCheckout(data)
        window.location.reload()
      } catch (error) {
        console.log(error)
        getforcePasswordReset(data.emailAddress)
      }
    } else {
      try {
        const getBCFieldsValue = {
          email: data.emailAddress,
          pass: data.password,
        }
        const {
          data: bcData, errors,
        } = await bcLogin(getBCFieldsValue)

        if (errors?.length || !bcData) {
          getforcePasswordReset(data.emailAddress)
        } else {
          const info = await getCurrentCustomerInfo(dispatch)

          if (info?.userType === 3 && info?.role === 3) {
            navigate('/dashboard')
          } else {
            navigate('/order')
          }
        }
      } catch (error) {
        console.log(error)
      }
    }
    setLoading(false)
  }

  const handleCreateAccountSubmit = () => {
    navigate('/registered')
  }

  const gotoForgotPassword = () => {
    navigate('/forgotpassword')
  }

  return (
    <LoginContainer>
      <B3Sping
        isSpinning={isLoading}
        tip={b3Lang('intl.global.tips.loading')}
      >
        {
          logo && loginInfo?.displayStoreLogo && (
          <LoginImage>
            <ImageListItem sx={{
              maxWidth: '250px',
            }}
            >
              <img
                src={`${logo}`}
                alt={b3Lang('intl.user.register.tips.registerLogo')}
                loading="lazy"
              />
            </ImageListItem>
          </LoginImage>
          )
        }

        {
          loginInfo?.loginTitle && (
          <Box
            sx={{
              mb: 2,
              mt: 2,
              display: 'flex',
              justifyContent: 'center',
              fontSize: '28px',
            }}
          >
            {loginInfo.loginTitle}
          </Box>
          )
        }

        {
          flag && (
            <Box
              sx={{
                padding: '0 5%',
                margin: '30px 0',
              }}
            >
              <Alert severity={(flag === '1' || flag === '4') ? 'error' : 'success'}>
                {tipInfo(flag, loginAccount?.emailAddress || '')}
              </Alert>
            </Box>

          )
        }
        <Box
          sx={{
            padding: '0 5%',
          }}
        >

          <LoginWidget
            sx={{
              padding: '10px',
            }}
            isVisible={loginInfo.isShowWidgetHead}
            html={loginInfo.widgetHeadText}
          />
          <Box sx={{
            margin: '50px 0',
            display: 'flex',
          }}
          >

            <Box sx={{
              width: '50%',
              paddingRight: '2%',
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center',
            }}
            >
              <LoginForm
                loginInfo={loginInfo}
                gotoForgotPassword={gotoForgotPassword}
                handleLoginSubmit={handleLoginSubmit}
              />
            </Box>

            <Box sx={{
              flex: '1',
              paddingLeft: '2%',
            }}
            >
              <LoginPanel
                loginInfo={loginInfo}
                handleSubmit={handleCreateAccountSubmit}
              />
            </Box>

          </Box>

          <LoginWidget
            sx={{
              padding: '20px',
            }}
            isVisible={loginInfo.isShowWidgetFooter}
            html={loginInfo.widgetFooterText}
          />

        </Box>

      </B3Sping>
    </LoginContainer>
  )
}
