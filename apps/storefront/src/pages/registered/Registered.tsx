import {
  useEffect,
  useState,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react'

import {
  ImageListItem,
} from '@mui/material'

import {
  useB3Lang,
} from '@b3/lang'

import type {
  OpenPageState,
} from '@b3/hooks'

import {
  getB2BRegisterLogo,
  getB2BCountries,
  storeB2BBasicInfo,
  getB2BAccountFormFields,
  getBCToken,
  getBCStoreChannelId,
  getB2BCompanyUserInfo,
} from '@/shared/service/b2b'

import {
  B3SStorage,
} from '@/utils'

import {
  getBCRegisterCustomFields,
  bcLogin,
  getCustomerInfo,
} from '@/shared/service/bc'

import RegisteredStep from './RegisteredStep'
import RegisterContent from './RegisterContent'

import {
  RegisteredContext,
} from './context/RegisteredContext'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  getRegisterLogo,
  companyAttachmentsFields,
  getAccountFormFields,
  RegisterFieldsItems,
  RegisterFields,
} from './config'

import {
  getloginTokenInfo,
  loginCheckout,
  getBCChannelId,
  ChannelstoreSites,
  LoginConfig,
} from '../login/config'

import {
  RegisteredContainer, RegisteredImage,
} from './styled'

// 1 bc 2 b2b
const formType: Array<number> = [1, 2]

interface RegisteredProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,
}

export default function Registered(props: RegisteredProps) {
  const {
    setOpenPage,
  } = props

  const [activeStep, setActiveStep] = useState(0)

  const [logo, setLogo] = useState('')

  const b3Lang = useB3Lang()

  const {
    state: {
      isLoading,
      accountType,
      contactInformation = [],
      passwordInformation = [],
      bcPasswordInformation = [],
      bcContactInformation = [],
    },
    dispatch,
  } = useContext(RegisteredContext)

  useEffect(() => {
    const getBCAdditionalFields = async () => {
      try {
        if (dispatch) {
          dispatch({
            type: 'loading',
            payload: {
              isLoading: true,
            },
          })
          dispatch({
            type: 'finishInfo',
            payload: {
              submitSuccess: false,
            },
          })
        }

        await getBCRegisterCustomFields()

        const accountFormAllFields = formType.map((item: number) => getB2BAccountFormFields(item))

        const accountFormFields = await Promise.all(accountFormAllFields)

        const bcAccountFormFields = getAccountFormFields(accountFormFields[0]?.accountFormFields || [])
        const b2bAccountFormFields = getAccountFormFields(accountFormFields[1]?.accountFormFields || [])

        const {
          quoteConfig,
        } = await getB2BRegisterLogo()
        const {
          countries,
        } = await getB2BCountries()
        const {
          storeBasicInfo: {
            storeName,
          },
        } = await storeB2BBasicInfo()
        const registerLogo = getRegisterLogo(quoteConfig)

        const newAddressInformationFields = b2bAccountFormFields.address.map((addressFields: Partial<RegisterFieldsItems>):Partial<RegisterFieldsItems> => {
          if (addressFields.name === 'country') {
            addressFields.options = countries
          }
          return addressFields
        })

        const newBCAddressInformationFields = bcAccountFormFields.address.map((addressFields: Partial<RegisterFieldsItems>):Partial<RegisterFieldsItems> => {
          if (addressFields.name === 'country') {
            addressFields.options = countries
          }
          return addressFields
        })

        if (dispatch) {
          dispatch({
            type: 'all',
            payload: {
              accountType: '1',
              isLoading: false,
              storeName,
              // account
              contactInformation: [...b2bAccountFormFields.contactInformation],
              bcContactInformation: [...bcAccountFormFields.contactInformation],
              additionalInformation: [...b2bAccountFormFields.additionalInformation],
              bcAdditionalInformation: [...bcAccountFormFields.additionalInformation],
              // detail
              companyExtraFields: [],
              companyInformation: [...b2bAccountFormFields?.businessDetails || []],
              companyAttachment: [...companyAttachmentsFields(b3Lang)],
              addressBasicFields: [...newAddressInformationFields],
              bcAddressBasicFields: [...newBCAddressInformationFields],
              countryList: [...countries],
              // password
              passwordInformation: [...b2bAccountFormFields.password],
              bcPasswordInformation: [...bcAccountFormFields.password],

            },
          })
        }
        setLogo(registerLogo)
      } catch (e) {
        // eslint-disable-next-line no-console
        console.log(e)
      }
    }

    getBCAdditionalFields()
  }, [])

  const isStepOptional = (step: number) => step === -1

  const getLoginData = () => {
    const emailAddress = (accountType === '1' ? contactInformation : bcContactInformation).find(
      (field: RegisterFields) => field.name === 'email',
    )?.default as string || ''

    const password = (accountType === '1' ? passwordInformation : bcPasswordInformation).find(
      (field: RegisterFields) => field.name === 'password',
    )?.default as string || ''

    return {
      emailAddress,
      password,
    }
  }
  const handleNext = async () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1)
  }

  const {
    state: {
      isCheckout,
      isCloseGotoBCHome,
    },
    dispatch: globalDispatch,
  } = useContext(GlobaledContext)

  const clearRegisterInfo = () => {
    if (dispatch) {
      dispatch({
        type: 'all',
        payload: {
          accountType: '',
          isLoading: false,
          storeName: '',
          submitSuccess: false,
          contactInformation: [],
          additionalInformation: [],
          companyExtraFields: [],
          companyInformation: [],
          companyAttachment: [],
          addressBasicFields: [],
          addressExtraFields: [],
          countryList: [],
          passwordInformation: [],
        },
      })
    }
  }

  const handleFinish = async () => {
    dispatch({
      type: 'loading',
      payload: {
        isLoading: true,
      },
    })

    const data: LoginConfig = getLoginData()

    if (isCheckout) {
      try {
        await loginCheckout(data)
        window.location.reload()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error)
      }
    } else {
      try {
        const {
          storeBasicInfo,
        }: any = await getBCStoreChannelId()

        const channelId = getBCChannelId((storeBasicInfo as ChannelstoreSites)?.storeSites || [])

        const loginTokenInfo = getloginTokenInfo(channelId)
        const {
          data: {
            token,
          },
        } = await getBCToken(loginTokenInfo)

        globalDispatch({
          type: 'common',
          payload: {
            BcToken: token,
          },
        })
        B3SStorage.set('BcToken', token)
        B3SStorage.set('emailAddress', data.emailAddress)

        const getBCFieldsValue = {
          email: data.emailAddress,
          pass: data.password,
        }

        await bcLogin(getBCFieldsValue)

        const {
          companyUserInfo: {
            userType,
            userInfo: {
              role,
            },
          },
        } = await getB2BCompanyUserInfo(data.emailAddress)

        const {
          data: {
            customer: {
              entityId: customerId,
              phone: phoneNumber,
              firstName,
              lastName,
              email: emailAddress,
            },
          },
        } = await getCustomerInfo()

        // 2 bc , 3 b2b
        globalDispatch({
          type: 'common',
          payload: {
            isB2BUser: userType === 3,
            role,
            isLogin: true,
            customerId,
            customer: {
              phoneNumber,
              firstName,
              lastName,
              emailAddress,
            },
            emailAddress: data.emailAddress,
          },
        })

        if (isCloseGotoBCHome) {
          window.location.href = '/'
        } else {
          setOpenPage({
            isOpen: false,
            openUrl: '',
          })
        }
        clearRegisterInfo()
      } catch (error) {
        // eslint-disable-next-line no-console
        console.log(error)
      }
    }

    dispatch({
      type: 'loading',
      payload: {
        isLoading: false,
      },
    })
  }

  return (
    <RegisteredContainer>
      <B3Sping
        isSpinning={isLoading}
        tip={b3Lang('intl.global.tips.loading')}
      >
        {
          logo && (
          <RegisteredImage>
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
          </RegisteredImage>
          )
        }
        <RegisteredStep
          activeStep={activeStep}
          isStepOptional={isStepOptional}
        >
          <RegisterContent
            activeStep={activeStep}
            handleBack={handleBack}
            handleNext={handleNext}
            handleFinish={handleFinish}
          />
        </RegisteredStep>
      </B3Sping>
    </RegisteredContainer>
  )
}
