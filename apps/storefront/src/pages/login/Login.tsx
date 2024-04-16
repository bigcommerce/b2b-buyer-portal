import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
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
import { b2bLogin, bcLogoutLogin, customerLoginAPI } from '@/shared/service/bc'
import { isLoggedInSelector, useAppSelector } from '@/store'
import { CustomerRole } from '@/types'
import { OpenPageState } from '@/types/hooks'
import {
  b2bLogger,
  B3SStorage,
  getCurrentCustomerInfo,
  loginjump,
  logoutSession,
  snackbar,
  storeHash,
} from '@/utils'

import LoginWidget from './component/LoginWidget'
import { loginCheckout, LoginConfig, LoginInfoInit } from './config'
import LoginForm from './LoginForm'
import LoginPanel from './LoginPanel'
import { LoginContainer, LoginImage } from './styled'

const initialLoginInfo = {
  loginTitle: 'Sign In',
  isShowWidgetHead: false,
  isShowWidgetBody: false,
  isShowWidgetFooter: false,
  loginBtn: 'Sign in',
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
  const { setOpenPage } = props

  const isLoggedIn = useAppSelector(isLoggedInSelector)
  const salesRepCompanyId = useAppSelector(
    ({ b2bFeatures }) => b2bFeatures.masqueradeCompany.id
  )
  const isAgenting = useAppSelector(
    ({ b2bFeatures }) => b2bFeatures.masqueradeCompany.isAgenting
  )
  const [isLoading, setLoading] = useState(true)
  const [isMobile] = useMobile()

  const [showTipInfo, setShowTipInfo] = useState<boolean>(true)
  const [flag, setLoginFlag] = useState<string>('')
  const [loginInfo, setLoginInfo] = useState<LoginInfoInit | null>(null)
  const [loginAccount, setLoginAccount] = useState<LoginConfig>({
    emailAddress: '',
    password: '',
  })
  const navigate = useNavigate()
  const b3Lang = useB3Lang()
  const [searchParams, setSearchParams] = useSearchParams()

  const {
    state: { isCheckout, logo, B3UserId, registerEnabled },
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

        const loginFlag = searchParams.get('loginFlag')
        const showTipInfo = searchParams.get('showTip') !== 'false'

        setShowTipInfo(showTipInfo)

        if (loginFlag) setLoginFlag(loginFlag)

        if (loginFlag === '7') {
          snackbar.error(b3Lang('login.loginText.invoiceErrorTip'))
        }
        if (loginFlag === '3' && isLoggedIn) {
          const { result } = (await bcLogoutLogin()).data.logout

          if (result !== 'success') return

          if (isAgenting) {
            await superAdminEndMasquerade(+salesRepCompanyId, +B3UserId)
          }

          // SUP-1282 Clear sessionStorage to allow visitors to display the checkout page
          window.sessionStorage.clear()

          logoutSession()
          setLoading(false)
          window.location.reload()
          return
        }

        setLoginInfo(Info)
        setLoading(false)
      } catch (e) {
        setLoginInfo(initialLoginInfo)
      }
    }

    init()
    // disabling as we only need to run this on the first render and its causing infinite loops when loging in
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

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
        case '6':
          str = b3Lang('login.loginText.deviceCrowdingLogIn')
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
    setSearchParams((prevURLSearchParams) => {
      prevURLSearchParams.delete('loginFlag')
      return prevURLSearchParams
    })

    if (isCheckout) {
      try {
        await loginCheckout(data)
        window.location.reload()
      } catch (error) {
        b2bLogger.error(error)
        getforcePasswordReset(data.emailAddress)
      }
    } else {
      try {
        const loginData = {
          email: data.emailAddress,
          password: data.password,
          storeHash: storeHash as string,
          channelId: B3SStorage.get('B3channelId'),
        }
        const {
          login: {
            result: { token, storefrontLoginToken },
            errors,
          },
        } = await b2bLogin({ loginData })

        B3SStorage.set('B2BToken', token)
        customerLoginAPI(storefrontLoginToken)

        if (errors?.length || !token) {
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
          const info = await getCurrentCustomerInfo(dispatch, token)

          if (
            info?.userType === 3 &&
            info?.role === CustomerRole.JUNIOR_BUYER
          ) {
            navigate('/dashboard')
            return
          }
          const isLoginLandLocation = loginjump(navigate)

          if (!isLoginLandLocation) return

          if (info?.role === CustomerRole.JUNIOR_BUYER) {
            navigate('/shoppingLists')
          } else {
            navigate('/orders')
          }
        }
      } catch (error) {
        snackbar.error(b3Lang('login.loginTipInfo.accountincorrect'))
      } finally {
        setLoading(false)
      }
    }
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
                    {tipInfo(flag, loginAccount?.emailAddress) && (
                      <Alert severity={setTipType(flag)} variant="filled">
                        {tipInfo(flag, loginAccount?.emailAddress || '')}
                      </Alert>
                    )}
                  </Box>
                )}
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
                          alt={b3Lang('login.registerLogo')}
                          loading="lazy"
                        />
                      </ImageListItem>
                    </LoginImage>
                  </Box>
                )}
                {loginInfo.widgetHeadText && (
                  <LoginWidget
                    sx={{
                      minHeight: '48px',
                      width: registerEnabled || isMobile ? '100%' : '50%',
                    }}
                    isVisible={loginInfo.isShowWidgetHead}
                    html={loginInfo.widgetHeadText}
                  />
                )}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    flexDirection: 'column',
                  }}
                >
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
                </Box>
                {loginInfo.widgetFooterText && (
                  <LoginWidget
                    sx={{
                      minHeight: '48px',
                      width: registerEnabled || isMobile ? '100%' : '50%',
                    }}
                    isVisible={loginInfo.isShowWidgetFooter}
                    html={loginInfo.widgetFooterText}
                  />
                )}
              </>
            )}
          </Box>
        </B3Sping>
      </LoginContainer>
    </B3Card>
  )
}
