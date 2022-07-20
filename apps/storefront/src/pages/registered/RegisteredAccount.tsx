import {
  useContext, ChangeEvent, useCallback, useState, MouseEvent,
} from 'react'
import {
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
} from '@mui/material'

import { useForm } from 'react-hook-form'

import styled from '@emotion/styled'

import { B3CustomForm } from '../../components'
import RegisteredStepButton from './component/RegisteredStepButton'
import RegisteredSigleCheckBox from './component/RegisteredSigleCheckBox'

import { RegisteredContext } from './context/RegisteredContext'

import { RegisterFileds, CustomFieldItems } from './config'

import { getB2BCompanyUserInfo } from '../../shared/service/b2b'

const InformationLabels = styled('h3')(() => ({
  marginBottom: '20px',
}))

const InformationFourLabels = styled('h4')(() => ({
  marginBottom: '20px',
}))

const TipContent = styled('div')(() => ({
  display: 'flex',
  flexDirection: 'row',
  alignItems: 'center',
}))

const TipLogin = styled('div')(() => ({
  cursor: 'pointer',
  color: '#1976d2',
  borderBottom: '1px solid #1976d2',
}))

interface RegisteredAccountProps {
  handleBack: () => void,
  handleNext: () => void,
  activeStep: number,
}

export default function RegisteredAccount(props: RegisteredAccountProps) {
  const { handleBack, handleNext, activeStep } = props

  const { state, dispatch } = useContext(RegisteredContext)

  const [emailStateType, setEmailStateType] = useState<number>(0)

  const {
    contactInformation, accountType, additionalInformation, bcContactInformationFields,
    emailMarketingNewsletter,
  } = state

  const {
    control, handleSubmit, getValues, formState: { errors }, setValue,
  } = useForm({
    mode: 'onSubmit',
  })

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'accountType', payload: { accountType: event.target.value } })
  }

  const judgeEmailExist = (userType: Number) => {
    if (accountType === '1' && userType === 2) {
      setEmailStateType(1)
    } else if (accountType === '1' && userType === 3) {
      setEmailStateType(2)
    } else if (accountType === '2' && userType === 3) {
      setEmailStateType(2)
    } else if (accountType === '2' && userType === 2) {
      setEmailStateType(2)
    }
  }

  const handleAccountToDetail = async (event: MouseEvent) => {
    // await captchaRef.current.executeAsync()

    handleSubmit((data: CustomFieldItems) => {
      dispatch({ type: 'loading', payload: { isLoading: true } })
      const email = accountType === '2' ? data.emailAddress : data.workEmailAddress
      getB2BCompanyUserInfo(email).then(({ companyUserInfo: { userType } }: any) => {
        if (userType === 1) {
          const contactInfo: any = accountType === '1' ? contactInformation : bcContactInformationFields
          const contactName = accountType === '1' ? 'contactInformation' : 'bcContactInformationFields'
          const newContactInfo = contactInfo.map((item: RegisterFileds) => {
            item.default = data[item.name] || item.default
            return item
          })
          let newAdditionalInformation: Array<RegisterFileds> = []
          if (additionalInformation) {
            newAdditionalInformation = (additionalInformation as Array<RegisterFileds>).map((item: RegisterFileds) => {
              item.default = data[item.name] || item.default
              return item
            })
          }
          dispatch({
            type: 'all',
            payload: {
              additionalInformation: [...newAdditionalInformation],
              [contactName]: [...newContactInfo],
            },
          })
          handleNext()
        } else {
          judgeEmailExist(userType)
        }
        dispatch({ type: 'loading', payload: { isLoading: false } })
      }).catch((err: any) => {
        console.log(err)
        dispatch({ type: 'loading', payload: { isLoading: false } })
      })
    })(event)
  }

  const gotoLigin = () => {
    (window as Window).location.href = '/login.php?action=create_account'
  }

  const handleEmailSletterChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    dispatch({ type: 'emailSletter', payload: { emailMarketingNewsletter: event.target.checked } })
  }, [])

  return (
    <Box
      sx={{
        pl: 10,
        pr: 10,
        mt: 2,
      }}
    >
      {
        emailStateType !== 0 && (
        <Alert
          severity="error"
        >
          <TipContent>
            It appears you may already have an account. Please first
            <Box
              sx={{
                ml: 1,
                mr: 1,
              }}
            >
              <TipLogin
                onClick={gotoLigin}
              >
                login
              </TipLogin>
            </Box>
            {
                emailStateType === 1 ? 'to apply for a business account' : ''
              }
          </TipContent>
        </Alert>
        )
      }

      <FormControl>
        <InformationLabels>Account Type</InformationLabels>
        <RadioGroup
          row
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          value={accountType}
          onChange={handleChange}
        >
          <FormControlLabel
            value="1"
            control={<Radio />}
            label="Business Account"
          />
          <FormControlLabel
            value="2"
            control={<Radio />}
            label="Personal Account"
          />
        </RadioGroup>
      </FormControl>
      <Box>
        <InformationFourLabels>Contact Information</InformationFourLabels>
        <B3CustomForm
          formFields={accountType === '1' ? contactInformation : bcContactInformationFields}
          errors={errors}
          control={control}
          getValues={getValues}
          setValue={setValue}
        />

      </Box>
      <Box
        sx={{
          mt: 4,
          ml: 2,
        }}
      >
        <RegisteredSigleCheckBox
          isChecked={emailMarketingNewsletter}
          onChange={handleEmailSletterChange}
        />
      </Box>
      <Box />
      <Box>
        <InformationFourLabels>Additional Information</InformationFourLabels>
        <B3CustomForm
          formFields={additionalInformation}
          errors={errors}
          control={control}
          getValues={getValues}
          setValue={setValue}
        />
      </Box>
      <RegisteredStepButton
        activeStep={activeStep}
        handleBack={handleBack}
        handleNext={handleAccountToDetail}
      />
    </Box>
  )
}
