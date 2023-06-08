import {
  Dispatch,
  SetStateAction,
  useContext,
  useEffect,
  useState,
} from 'react'
import { useSelector } from 'react-redux'
import { useNavigate } from 'react-router-dom'
import type { OpenPageState } from '@b3/hooks'
import { useB3Lang } from '@b3/lang'
import { Box, ImageListItem } from '@mui/material'

import { B3Card, B3Sping } from '@/components'
import { useMobile, useScrollBar } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import { getB2BAccountFormFields, getB2BCountries } from '@/shared/service/b2b'
import {
  // getBCRegisterCustomFields,
  bcLogin,
} from '@/shared/service/bc'
import { themeFrameSelector } from '@/store'
import { getCurrentCustomerInfo } from '@/utils'

import { loginCheckout, LoginConfig } from '../login/config'

import { RegisteredContext } from './context/RegisteredContext'
import {
  companyAttachmentsFields,
  getAccountFormFields,
  RegisterFields,
  RegisterFieldsItems,
} from './config'
import RegisterContent from './RegisterContent'
import RegisteredStep from './RegisteredStep'
import { RegisteredContainer, RegisteredImage } from './styled'

// 1 bc 2 b2b
const formType: Array<number> = [1, 2]

interface RegisteredProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

function Registered(props: RegisteredProps) {
  const { setOpenPage } = props

  const [activeStep, setActiveStep] = useState(0)

  const b3Lang = useB3Lang()
  const [isMobile] = useMobile()

  const navigate = useNavigate()

  const IframeDocument = useSelector(themeFrameSelector)

  const {
    state: { isCheckout, isCloseGotoBCHome, logo, storeName },
    dispatch: globalDispatch,
  } = useContext(GlobaledContext)

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

  const {
    state: {
      accountLoginRegistration,
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)

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

        // await getBCRegisterCustomFields()

        const accountFormAllFields = formType.map((item: number) =>
          getB2BAccountFormFields(item)
        )

        const accountFormFields = await Promise.all(accountFormAllFields)

        const bcAccountFormFields = getAccountFormFields(
          accountFormFields[0]?.accountFormFields || []
        )
        const b2bAccountFormFields = getAccountFormFields(
          accountFormFields[1]?.accountFormFields || []
        )

        const { countries } = await getB2BCountries()

        const newAddressInformationFields =
          b2bAccountFormFields.address?.map(
            (
              addressFields: Partial<RegisterFieldsItems>
            ): Partial<RegisterFieldsItems> => {
              if (addressFields.name === 'country') {
                addressFields.options = countries
              }
              return addressFields
            }
          ) || []

        const newBCAddressInformationFields =
          bcAccountFormFields.address?.map(
            (
              addressFields: Partial<RegisterFieldsItems>
            ): Partial<RegisterFieldsItems> => {
              if (addressFields.name === 'country') {
                addressFields.options = countries
              }
              return addressFields
            }
          ) || []
        // accountLoginRegistration
        const { b2b, b2c } = accountLoginRegistration
        const accountB2cEnabledInfo = b2c && !b2b
        if (dispatch) {
          dispatch({
            type: 'all',
            payload: {
              accountType: accountB2cEnabledInfo ? '2' : '1',
              isLoading: false,
              storeName,
              // account
              contactInformation: [
                ...(b2bAccountFormFields.contactInformation || []),
              ],
              bcContactInformation: [
                ...(bcAccountFormFields.contactInformation || []),
              ],
              additionalInformation: [
                ...(b2bAccountFormFields.additionalInformation || []),
              ],
              bcAdditionalInformation: [
                ...(bcAccountFormFields.additionalInformation || []),
              ],
              // detail
              companyExtraFields: [],
              companyInformation: [
                ...(b2bAccountFormFields?.businessDetails || []),
              ],
              companyAttachment: [...companyAttachmentsFields(b3Lang)],
              addressBasicFields: [...newAddressInformationFields],
              bcAddressBasicFields: [...newBCAddressInformationFields],
              countryList: [...countries],
              // password
              passwordInformation: [...(b2bAccountFormFields.password || [])],
              bcPasswordInformation: [...(bcAccountFormFields.password || [])],
            },
          })
        }
      } catch (e) {
        console.log(e)
      }
    }

    getBCAdditionalFields()
  }, [])

  const isStepOptional = (step: number) => step === -1

  const getLoginData = () => {
    const emailAddress =
      ((accountType === '1' ? contactInformation : bcContactInformation).find(
        (field: RegisterFields) => field.name === 'email'
      )?.default as string) || ''

    const password =
      ((accountType === '1' ? passwordInformation : bcPasswordInformation).find(
        (field: RegisterFields) => field.name === 'password'
      )?.default as string) || ''

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
        console.log(error)
      }
    } else {
      try {
        const getBCFieldsValue = {
          email: data.emailAddress,
          pass: data.password,
        }

        await bcLogin(getBCFieldsValue)

        await getCurrentCustomerInfo(globalDispatch)

        if (isCloseGotoBCHome) {
          window.location.href = '/'
        } else {
          navigate('/orders')
        }
        clearRegisterInfo()
      } catch (error) {
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

  useEffect(() => {
    IframeDocument?.body.scrollIntoView(true)
  }, [activeStep])

  useScrollBar(false)

  return (
    <B3Card setOpenPage={setOpenPage}>
      <RegisteredContainer isMobile={isMobile}>
        <B3Sping
          isSpinning={isLoading}
          tip={b3Lang('intl.global.tips.loading')}
          transparency="0"
        >
          <Box
            sx={{
              display: 'flex',
              flexDirection: 'column',
              width: '100%',
              alignItems: 'center',
            }}
          >
            {logo && (
              <RegisteredImage>
                <ImageListItem
                  sx={{
                    maxWidth: '250px',
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
              </RegisteredImage>
            )}
            <RegisteredStep
              activeStep={activeStep}
              isStepOptional={isStepOptional}
              backgroundColor={backgroundColor}
            >
              <RegisterContent
                activeStep={activeStep}
                handleBack={handleBack}
                handleNext={handleNext}
                handleFinish={handleFinish}
              />
            </RegisteredStep>
          </Box>
        </B3Sping>
      </RegisteredContainer>
    </B3Card>
  )
}

export default Registered
