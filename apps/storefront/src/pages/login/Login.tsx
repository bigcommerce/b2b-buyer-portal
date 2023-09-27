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
import {
  getBCForcePasswordReset,
  superAdminEndMasquerade,
} from '@/shared/service/b2b'
import {
  bcLogin,
  // bcLogoutLogin,
} from '@/shared/service/bc'
import {
  B3SStorage,
  clearCurrentCustomerInfo,
  getCurrentCustomerInfo,
} from '@/utils'

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

type AlertColor = 'success' | 'info' | 'warning' | 'error'

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
    state: {
      isCheckout,
      logo,
      B3UserId,
      salesRepCompanyId = 0,
      isAgenting,
      registerEnabled,
    },
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
          loginTitle: pageTitle || b3Lang('login.button.signIn'),
          loginBtn: signInButtonText || b3Lang('login.button.signInUppercase'),
          CreateAccountButtonText:
            createAccountButtonText || b3Lang('login.button.createAccount'),
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

          if (isAgenting) {
            await superAdminEndMasquerade(+salesRepCompanyId, +B3UserId)
          }
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
          str = b3Lang('login.loginTipInfo.resetPassword', {
            email,
          })
          break
        case '2':
          str = b3Lang('login.loginTipInfo.receivePassword')
          break
        case '3':
          str = b3Lang('login.loginTipInfo.loggedOutLogin')
          break
        case '4':
          str = b3Lang('login.loginTipInfo.accountincorrect')
          break
        case '5':
          str = b3Lang('login.loginTipInfo.accountPrelaunch')
          break
        default:
          str = ''
      }
    }
    return str
  }

  const setTipType = (flag: string): AlertColor | undefined => {
    if (!flag) return undefined
    let tipType: AlertColor = 'success'
    switch (flag) {
      case '1':
        tipType = 'error'
        break
      case '4':
        tipType = 'error'
        break
      case '5':
        tipType = 'warning'
        break
      default:
        tipType = 'success'
    }
    return tipType
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

        if (bcData?.login?.customer) {
          B3SStorage.set('loginCustomer', {
            emailAddress: bcData.login.customer.email,
            phoneNumber: bcData.login.customer.phone,
            ...bcData.login.customer,
          })
        }

        if (errors?.length || !bcData) {
          if (errors?.length) {
            const { message } = errors[0]
            if (
              message ===
              'Operation cannot be performed as the storefront channel is not live'
            ) {
              setLoginFlag('5')
              setLoading(false)
              return
            }
          }
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
    navigate('/register')
  }

  const gotoForgotPassword = () => {
    navigate('/forgotpassword')
  }

  const loginAndRegisterContainerWidth = registerEnabled ? '100%' : '50%'
  const loginContainerWidth = registerEnabled ? '50%' : 'auto'

  return (
    <B3Card setOpenPage={setOpenPage}>
      <LoginContainer paddings={isMobile ? '0' : '20px 20px'}>
        <B3Sping
          isSpinning={isLoading}
          tip={b3Lang('global.tips.loading')}
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
                {flag && showTipInfo && (
                  <Box
                    sx={{
                      padding: isMobile ? 0 : '0 5%',
                      margin: '30px 0 0 0',
                    }}
                  >
                    <Alert severity={setTipType(flag)} variant="filled">
                      {tipInfo(flag, loginAccount?.emailAddress || '')}
                    </Alert>
                  </Box>
                )}
                <Box
                  sx={{
                    padding: isMobile ? 0 : '0 5%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                  }}
                >
                  {loginInfo.widgetHeadText && (
                    <LoginWidget
                      sx={{
                        mt: isMobile ? '20px' : '32px',
                        minHeight: '48px',
                        width: registerEnabled || isMobile ? '100%' : '50%',
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
                      flexDirection: 'column',
                      justifyContent: 'center',
                      width: isMobile ? 'auto' : loginAndRegisterContainerWidth,
                    }}
                  >
                    {logo && loginInfo?.displayStoreLogo && (
                      <Box sx={{ margin: '20px 0', minHeight: '150px' }}>
                        <LoginImage>
                          <ImageListItem
                            sx={{
                              maxWidth: isMobile ? '70%' : '250px',
                            }}
                            onClick={() => {
                              window.location.href = '/'
                            }}
                          >
                            <img
                              src={`${logo}`}
                              alt={b3Lang(
                                'intl.user.register.tips.registerLogo'
                              )}
                              loading="lazy"
                            />
                          </ImageListItem>
                        </LoginImage>
                      </Box>
                    )}
                    <Box
                      sx={{
                        mb: '20px',
                        display: 'flex',
                        flexDirection: isMobile ? 'column' : 'row',
                        justifyContent: 'center',
                        width: isMobile ? 'auto' : '100%',
                      }}
                    >
                      <Box
                        sx={{
                          width: isMobile ? 'auto' : loginContainerWidth,
                          paddingRight: isMobile ? 0 : '2%',
                          ml: '16px',
                          mr: isMobile ? '16px' : '',
                          pb: registerEnabled ? '' : '36px',
                        }}
                      >
                        <LoginForm
                          loginInfo={loginInfo}
                          gotoForgotPassword={gotoForgotPassword}
                          handleLoginSubmit={handleLoginSubmit}
                          backgroundColor={backgroundColor}
                        />
                      </Box>

                      {registerEnabled && (
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
                      )}
                    </Box>
                  </Box>

                  {loginInfo.widgetFooterText && (
                    <LoginWidget
                      sx={{
                        mt: '20px',
                        minHeight: '48px',
                        width: registerEnabled || isMobile ? '100%' : '50%',
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
