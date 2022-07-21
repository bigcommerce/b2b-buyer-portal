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

import { useB3Lang } from '@b3/lang'

import { useForm } from 'react-hook-form'

import { B3CustomForm } from '../../components'
import RegisteredStepButton from './component/RegisteredStepButton'
import RegisteredSigleCheckBox from './component/RegisteredSigleCheckBox'

import { RegisteredContext } from './context/RegisteredContext'

import { RegisterFields, CustomFieldItems } from './config'

import { getB2BCompanyUserInfo } from '../../shared/service/b2b'

import {
  InformationFourLabels, TipContent, TipLogin,
} from './styled'

interface RegisteredAccountProps {
  handleBack: () => void,
  handleNext: () => void,
  activeStep: number,
}

export default function RegisteredAccount(props: RegisteredAccountProps) {
  const { handleBack, handleNext, activeStep } = props

  const { state, dispatch } = useContext(RegisteredContext)

  const b3Lang = useB3Lang()

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
          const newContactInfo = contactInfo.map((item: RegisterFields) => {
            item.default = data[item.name] || item.default
            return item
          })
          let newAdditionalInformation: Array<RegisterFields> = []
          if (additionalInformation) {
            newAdditionalInformation = (additionalInformation as Array<RegisterFields>).map((item: RegisterFields) => {
              item.default = data[item.name] || item.default
              return item
            })
          }
          setEmailStateType(0)
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

  const additionalList: any = accountType === '1' ? contactInformation : bcContactInformationFields

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
            {b3Lang('intl.user.register.registeredAccount.loginLeft')}
            {emailStateType === 1 ? ` ${b3Lang('intl.user.register.registeredAccount.loginFirst')}` : ''}
            <Box
              sx={{
                ml: 1,
                mr: 1,
              }}
            >
              <TipLogin
                onClick={gotoLigin}
              >
                {b3Lang('intl.user.register.registeredAccount.loginBtn')}
              </TipLogin>
            </Box>
            {
                emailStateType === 1 ? `${b3Lang('intl.user.register.registeredAccount.loginb2b')}` : ''
              }
          </TipContent>
        </Alert>
        )
      }

      <FormControl>
        <InformationFourLabels>{b3Lang('intl.user.register.registeredAccount.accountType')}</InformationFourLabels>
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
            label={b3Lang('intl.user.register.registeredAccount.businessAccount')}
          />
          <FormControlLabel
            value="2"
            control={<Radio />}
            label={b3Lang('intl.user.register.registeredAccount.personalAccount')}
          />
        </RadioGroup>
      </FormControl>

      <Box>
        <InformationFourLabels>{b3Lang('intl.user.register.registeredAccount.contactInformation')}</InformationFourLabels>
        <B3CustomForm
          formFields={additionalList}
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
      {
        (additionalInformation && additionalInformation.length) ? (
          <Box>
            <InformationFourLabels>{b3Lang('intl.user.register.registeredAccount.additionalInformation')}</InformationFourLabels>
            <B3CustomForm
              formFields={additionalInformation}
              errors={errors}
              control={control}
              getValues={getValues}
              setValue={setValue}
            />
          </Box>
        ) : ''
      }

      <RegisteredStepButton
        activeStep={activeStep}
        handleBack={handleBack}
        handleNext={handleAccountToDetail}
      />
    </Box>
  )
}
