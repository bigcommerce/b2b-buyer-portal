import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import type { OpenPageState } from '@b3/hooks'
import { useB3Lang } from '@b3/lang'
import { Alert, Box, ImageListItem } from '@mui/material'

import { B3Card, B3Sping } from '@/components'
import { useMobile } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { defaultCreateAccountPanel } from '@/shared/customStyleButtton/context/config'
import { GlobaledContext } from '@/shared/global'
import { getBCForcePasswordReset } from '@/shared/service/b2b'
import {
  bcLogin,
  // bcLogoutLogin,
} from '@/shared/service/bc'
import { clearCurrentCustomerInfo, getCurrentCustomerInfo } from '@/utils'

import LoginWidget from './component/LoginWidget'
import {
  getLoginFlag,
  loginCheckout,
  LoginConfig,
  LoginInfoInit,
} from './config'
import LoginForm from './LoginForm'
import LoginPanel from './LoginPanel'
import { LoginContainer, LoginImage } from './styled'

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
interface RegisteredProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

export default function Login(props: RegisteredProps) {
  const [isLoading, setLoading] = useState(true)
  const [isMobile] = useMobile()

  const { setOpenPage } = props

  const [showTipInfo, setShowTipInfo] = useState<boolean>(true)
  const [flag, setLoginFlag] = useState<string>('')
  const [loginAccount, setLoginAccount] = useState<LoginConfig>({
    emailAddress: '',
  })
  const location = useLocation()

  const [loginInfo, setLoginInfo] = useState<LoginInfoInit | null>(null)

  const navigate = useNavigate()

  const b3Lang = useB3Lang()

  const {
    state: { isCheckout, logo },
    dispatch,
  } = useContext(GlobaledContext)

  const {
    state: {
      loginPageButton,
      loginPageDisplay,
      loginPageHtml,
      portalStyle: { backgroundColor = 'FEF9F5' },
    },
  } = useContext(CustomStyleContext)

  useEffect(() => {
    const init = async () => {
      try {
        const {
          createAccountButtonText,
          primaryButtonColor,
          signInButtonText,
        } = loginPageButton
        const { displayStoreLogo, pageTitle } = loginPageDisplay

        const {
          bottomHtmlRegionEnabled,
          bottomHtmlRegionHtml,
          createAccountPanelHtml,
          topHtmlRegionEnabled,
          topHtmlRegionHtml,
        } = loginPageHtml

        const Info = {
          loginTitle: pageTitle || 'Sign In',
          loginBtn: signInButtonText || 'SIGN IN',
          CreateAccountButtonText: createAccountButtonText || 'CREATE ACCOUNT',
          btnColor: primaryButtonColor || '',
          isShowWidgetHead: topHtmlRegionEnabled || false,
          widgetHeadText: topHtmlRegionHtml || '',
          widgetBodyText: createAccountPanelHtml || defaultCreateAccountPanel,
          isShowWidgetFooter: bottomHtmlRegionEnabled || false,
          widgetFooterText: bottomHtmlRegionHtml || '',
          displayStoreLogo: displayStoreLogo || false,
        }

        const { search } = location

        const loginFlag = getLoginFlag(search, 'loginFlag')
        const showTipInfo = getLoginFlag(search, 'showTip') !== 'false'

        setShowTipInfo(showTipInfo)

        if (loginFlag) setLoginFlag(loginFlag)

        if (loginFlag === '3') {
          // await bcLogoutLogin()

          dispatch({
            type: 'common',
            payload: {
              isCloseGotoBCHome: true,
            },
          })

          clearCurrentCustomerInfo(dispatch)
          await fetch('/login.php?action=logout')
        }

        setLoginInfo(Info)
        setLoading(false)
      } catch (e) {
        setLoginInfo(initialLoginInfo)
      }
    }

    init()
  }, [loginPageButton, loginPageDisplay, loginPageHtml])

  const tipInfo = (loginFlag: string, email = '') => {
    let str = ''
    if (loginFlag) {
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
    }
    return str
  }

  const getforcePasswordReset = async (email: string) => {
    const {
      companyUserInfo: {
        userInfo: { forcePasswordReset },
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
        const { data: bcData, errors } = await bcLogin(getBCFieldsValue)

        if (errors?.length || !bcData) {
          getforcePasswordReset(data.emailAddress)
        } else {
          const info = await getCurrentCustomerInfo(dispatch)

          if (info?.userType === 3 && info?.role === 3) {
            navigate('/dashboard')
          } else {
            navigate('/orders')
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
    <B3Card setOpenPage={setOpenPage}>
      <LoginContainer paddings={isMobile ? '0' : '20px 20px'}>
        <B3Sping
          isSpinning={isLoading}
          tip={b3Lang('intl.global.tips.loading')}
          background="transparent"
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              minHeight: '400px',
              minWidth: '343px',
            }}
          >
            {loginInfo && (
              <>
                {logo && loginInfo?.displayStoreLogo && (
                  <LoginImage>
                    <ImageListItem
                      sx={{
                        maxWidth: isMobile ? '70%' : '250px',
                        maxHeight: isMobile ? '70%' : '250px',
                      }}
                      onClick={() => {
                        window.location.href = '/'
                      }}
                    >
                      <img
                        src={`${logo}`}
                        alt={b3Lang('intl.user.register.tips.registerLogo')}
                        loading="lazy"
                      />
                    </ImageListItem>
                  </LoginImage>
                )}

                {flag && showTipInfo && (
                  <Box
                    sx={{
                      padding: isMobile ? 0 : '0 5%',
                      margin: '30px 0 0 0',
                    }}
                  >
                    <Alert
                      severity={
                        flag === '1' || flag === '4' ? 'error' : 'success'
                      }
                      variant="filled"
                    >
                      {tipInfo(flag, loginAccount?.emailAddress || '')}
                    </Alert>
                  </Box>
                )}
                <Box
                  sx={{
                    padding: isMobile ? 0 : '0 5%',
                  }}
                >
                  {loginInfo.widgetHeadText && (
                    <LoginWidget
                      sx={{
                        bgcolor: '#D9D9D9',
                        mt: isMobile ? '20px' : '32px',
                        minHeight: '48px',
                      }}
                      isVisible={loginInfo.isShowWidgetHead}
                      html={loginInfo.widgetHeadText}
                    />
                  )}
                  <Box
                    sx={{
                      bgcolor: '#FFFFFF',
                      borderRadius: '4px',
                      margin: '20px 0',
                      display: 'flex',
                      flexDirection: isMobile ? 'column' : 'row',
                    }}
                  >
                    <Box
                      sx={{
                        width: isMobile ? 'auto' : '50%',
                        paddingRight: isMobile ? 0 : '2%',
                        ml: '16px',
                        mr: isMobile ? '16px' : '',
                      }}
                    >
                      <LoginForm
                        loginInfo={loginInfo}
                        gotoForgotPassword={gotoForgotPassword}
                        handleLoginSubmit={handleLoginSubmit}
                        backgroundColor={backgroundColor}
                      />
                    </Box>

                    <Box
                      sx={{
                        flex: '1',
                        paddingLeft: isMobile ? 0 : '2%',
                      }}
                    >
                      <LoginPanel
                        loginInfo={loginInfo}
                        handleSubmit={handleCreateAccountSubmit}
                      />
                    </Box>
                  </Box>

                  {loginInfo.widgetFooterText && (
                    <LoginWidget
                      sx={{
                        bgcolor: '#D9D9D9',
                        mt: '20px',
                        minHeight: '48px',
                      }}
                      isVisible={loginInfo.isShowWidgetFooter}
                      html={loginInfo.widgetFooterText}
                    />
                  )}
                </Box>
              </>
            )}
          </Box>
        </B3Sping>
      </LoginContainer>
    </B3Card>
  )
}
