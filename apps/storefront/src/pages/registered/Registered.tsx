import {
  useEffect, useState, useContext,
} from 'react'
import { useNavigate } from 'react-router-dom'

import { ImageListItem } from '@mui/material'

import { useB3Lang } from '@b3/lang'

import { getBCRegisterCustomFields } from '../../shared/service/bc'
import {
  getB2BRegisterCustomFields, getB2BRegisterLogo, getB2BCountries, storeB2BBasicInfo,
} from '../../shared/service/b2b'

import RegisteredStep from './RegisteredStep'
import RegisterContent from './RegisterContent'

import { RegisteredContext } from './context/RegisteredContext'

import { B3Sping } from '../../components/spin/B3Sping'

import {
  conversionDataFormat,
  bcContactInformationFields,
  RegisterFileds,
  contactInformationFields,
  getRegisterLogo,
  companyInformationFields,
  companyAttachmentsFields,
  addressInformationFields,
} from './config'

import { RegisteredContainer, RegisteredImage } from './styled'

export default function Registered() {
  const [activeStep, setActiveStep] = useState(0)
  const navigate = useNavigate()

  const [logo, setLogo] = useState('')

  const b3Lang = useB3Lang()

  const { state: { isLoading }, dispatch } = useContext(RegisteredContext)

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

        const { customerAccount, billingAddress } = await getBCRegisterCustomFields()
        const { companyExtraFields } = await getB2BRegisterCustomFields()
        const { quoteConfig } = await getB2BRegisterLogo()
        const { countries } = await getB2BCountries()
        const { storeBasicInfo: { storeName } } = await storeB2BBasicInfo()
        const registerLogo = getRegisterLogo(quoteConfig)

        const newCustomerAccount = customerAccount.length && customerAccount.filter((field: RegisterFileds) => field.custom)
        const newAdditionalInformation: Array<RegisterFileds> = conversionDataFormat(newCustomerAccount)

        const filterCompanyExtraFields = companyExtraFields.length && companyExtraFields.filter((field: RegisterFileds) => field?.visibleToEnduser)
        const newCompanyExtraFields: Array<RegisterFileds> = conversionDataFormat(filterCompanyExtraFields)

        const customAddress = billingAddress.length && billingAddress.filter((field: RegisterFileds) => field.custom)
        const addressExtraFields: Array<RegisterFileds> = conversionDataFormat(customAddress)

        const newAddressInformationFields = addressInformationFields(b3Lang).map((addressFileds) => {
          if (addressFileds.name === 'country') {
            addressFileds.options = countries
          }
          return addressFileds
        })

        const filterPasswordInformation = customerAccount.length && customerAccount.filter((field: RegisterFileds) => !field.custom && field.fieldType === 'password')
        const newPasswordInformation: Array<RegisterFileds> = conversionDataFormat(filterPasswordInformation)
        if (dispatch) {
          dispatch({
            type: 'all',
            payload: {
              accountType: '1',
              isLoading: false,
              storeName,
              contactInformation: [...contactInformationFields],
              additionalInformation: [...newAdditionalInformation],
              bcContactInformationFields: [...bcContactInformationFields],
              companyExtraFields: [...newCompanyExtraFields],
              companyInformation: [...companyInformationFields(b3Lang)],
              companyAttachment: [...companyAttachmentsFields(b3Lang)],
              addressBasicFields: [...newAddressInformationFields],
              addressExtraFields: [...addressExtraFields],
              countryList: [...countries],
              passwordInformation: [...newPasswordInformation],
            },
          })
        }
        setLogo(registerLogo)
      } catch (e) {
        console.log(e)
      }
    }

    getBCAdditionalFields()
  }, [])

  const isStepOptional = (step: number) => step === 1

  const handleNext = async () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1)
  }

  const handleFinish = () => {
    const isHasFrontPage = window?.history?.length > 2
    if (dispatch) {
      dispatch({
        type: 'finishInfo',
        payload: {
          submitSuccess: false,
        },
      })
    }

    if (isHasFrontPage) {
      navigate(-1)
    } else {
      navigate('/')
    }
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
