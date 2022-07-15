import {
  useEffect, useState, useContext,
} from 'react'

import styled from '@emotion/styled'

import { ImageListItem } from '@mui/material'
import { getBCRegisterCustomFields } from '@/shared/service/bc'
import { getB2BRegisterCustomFields, getB2BRegisterLogo } from '@/shared/service/b2b'

import RegisteredStep from './RegisteredStep'
import RegisterContent from './RegisterContent'

import { RegisteredContext } from './context/RegisteredContext'

import { B3Sping } from '@/components/B3Sping'

import {
  conversionDataFormat, bcContactInformationFields, RegisterFileds, contactInformationFields, getRegisterLogo,
} from './config'

const RegisteredContainer = styled('div')({
  padding: '20px 20px',
})

const RegisteredImage = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  justifyContent: 'center',
  alignItems: 'center',
  width: '100%',
  height: '250px',
})

export default function Registered() {
  const [activeStep, setActiveStep] = useState(0)

  const [logo, setLogo] = useState('')

  const [isloadding, setLoadding] = useState(true)

  const { dispatch } = useContext(RegisteredContext)

  useEffect(() => {
    const getBCAdditionalFields = async () => {
      try {
        const { customerAccount } = await getBCRegisterCustomFields()
        const { companyExtraFields } = await getB2BRegisterCustomFields()
        const { quoteConfig } = await getB2BRegisterLogo()
        const registerLogo = getRegisterLogo(quoteConfig)
        const newCustomerAccount = customerAccount.length && customerAccount.filter((field: RegisterFileds) => field.custom)
        const filterCompanyExtraFields = companyExtraFields.length && companyExtraFields.filter((field: RegisterFileds) => !field?.visibleToEnduser)
        const newAdditionalInformation: Array<RegisterFileds> = conversionDataFormat(newCustomerAccount)
        const newCompanyExtraFields: Array<RegisterFileds> = conversionDataFormat(filterCompanyExtraFields)
        console.log(newCompanyExtraFields, 'newCompanyExtraFields')
        if (dispatch) {
          dispatch({
            type: 'all',
            payload: {
              accountType: '1',
              contactInformation: [...contactInformationFields],
              additionalInformation: [...newAdditionalInformation],
              bcContactInformationFields: [...bcContactInformationFields],
            },
          })
        }
        setLogo(registerLogo)
        setLoadding(false)
      } catch (e) {
        console.log(e)
      }
    }

    getBCAdditionalFields()
  }, [])

  const isStepOptional = (step: number) => step === 1

  const handleNext = () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep + 1)
  }

  const handleBack = () => {
    setActiveStep((prevActiveStep: number) => prevActiveStep - 1)
  }

  const handleReset = () => {
    setActiveStep(0)
  }

  return (
    <RegisteredContainer>
      <B3Sping
        isSpinning={isloadding}
        tip="loadding..."
      >
        {
          logo && (
          <RegisteredImage>
            <ImageListItem>
              <img
                src={`${logo}`}
                alt="register Logo"
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
            handleReset={handleReset}
            handleBack={handleBack}
            handleNext={handleNext}
          />
        </RegisteredStep>
      </B3Sping>
    </RegisteredContainer>
  )
}
