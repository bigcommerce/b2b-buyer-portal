import {
  useEffect,
  useState,
  useContext,
  Dispatch,
  SetStateAction,
} from 'react'

import type {
  OpenPageState,
} from '@b3/hooks'

import {
  ImageListItem,
} from '@mui/material'

import {
  useB3Lang,
} from '@b3/lang'

import {
  getB2BRegisterLogo,
  getB2BCountries,
  storeB2BBasicInfo,
  getB2BAccountFormFields,
} from '@/shared/service/b2b'

import RegisteredStep from './RegisteredStep'
import RegisterContent from './RegisterContent'

import {
  RegisteredContext,
} from './context/RegisteredContext'

import {
  B3Sping,
} from '@/components/spin/B3Sping'

import {
  getRegisterLogo,
  companyAttachmentsFields,
  getAccountFormFields,
  RegisterFieldsItems,
} from './config'

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

  const handleNext = async () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1)
  }

  const handleFinish = () => {
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

    setOpenPage({
      isOpen: false,
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
              maxWidth: '130px',
              maxHeight: '130px',
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
