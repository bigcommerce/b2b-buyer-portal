import {
  useContext,
  ChangeEvent,
  useState,
  MouseEvent,
} from 'react'
import {
  Box,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  Alert,
} from '@mui/material'

import {
  useB3Lang,
} from '@b3/lang'

import {
  useForm,
} from 'react-hook-form'

import {
  B3CustomForm,
} from '@/components'
import RegisteredStepButton from './component/RegisteredStepButton'

import {
  RegisteredContext,
} from './context/RegisteredContext'

import {
  RegisterFields, CustomFieldItems,
} from './config'

import {
  getB2BCompanyUserInfo,
} from '@/shared/service/b2b'

import {
  InformationFourLabels, TipContent,
  TipLogin,
} from './styled'

interface RegisteredAccountProps {
  handleBack: () => void,
  handleNext: () => void,
  activeStep: number,
}

export default function RegisteredAccount(props: RegisteredAccountProps) {
  const {
    handleBack,
    handleNext,
    activeStep,
  } = props

  const {
    state,
    dispatch,
  } = useContext(RegisteredContext)

  const b3Lang = useB3Lang()

  const [emailStateType, setEmailStateType] = useState<number>(0)

  const {
    contactInformation, accountType, additionalInformation,
    bcContactInformation,
    bcAdditionalInformation,
  } = state

  const {
    control,
    handleSubmit,
    getValues,
    formState: {
      errors,
    },
    setValue,
  } = useForm({
    mode: 'onSubmit',
  })

  const additionName = accountType === '1' ? 'additionalInformation' : 'bcAdditionalInformation'
  const additionalInfo: any = accountType === '1' ? additionalInformation : bcAdditionalInformation

  const contactInfo: any = accountType === '1' ? contactInformation : bcContactInformation
  const contactName = accountType === '1' ? 'contactInformation' : 'bcContactInformationFields'

  const contactInformationLabel = contactInfo.length ? contactInfo[0]?.groupName : ''

  const additionalInformationLabel = additionalInfo.length ? additionalInfo[0]?.groupName : ''

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'accountType',
      payload: {
        accountType: event.target.value,
      },
    })
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
    handleSubmit((data: CustomFieldItems) => {
      dispatch({
        type: 'loading',
        payload: {
          isLoading: true,
        },
      })

      const emailItem: any = contactInformation?.filter((item: any) => item.fieldId === 'field_email')
      const email = data[emailItem[0]?.name]

      getB2BCompanyUserInfo(email).then(({
        companyUserInfo: {
          userType,
        },
      }: any) => {
        if (userType === 1) {
          const newContactInfo = contactInfo.map((item: RegisterFields) => {
            item.default = data[item.name] || item.default
            return item
          })

          let newAdditionalInformation: Array<RegisterFields> = []
          if (additionalInfo) {
            newAdditionalInformation = (additionalInfo as Array<RegisterFields>).map((item: RegisterFields) => {
              item.default = data[item.name] || item.default
              return item
            })
          }
          setEmailStateType(0)
          dispatch({
            type: 'all',
            payload: {
              [additionName]: [...newAdditionalInformation],
              [contactName]: [...newContactInfo],
            },
          })
          handleNext()
        } else {
          judgeEmailExist(userType)
        }
        dispatch({
          type: 'loading',
          payload: {
            isLoading: false,
          },
        })
      }).catch(() => {
        dispatch({
          type: 'loading',
          payload: {
            isLoading: false,
          },
        })
      })
    })(event)
  }

  const gotoLigin = () => {
    (window as Window).location.href = '/login.php?action=create_account'
  }

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
        <InformationFourLabels>{contactInformationLabel}</InformationFourLabels>
        <B3CustomForm
          formFields={contactInfo}
          errors={errors}
          control={control}
          getValues={getValues}
          setValue={setValue}
        />

      </Box>

      <Box />
      {
        (additionalInfo && additionalInfo.length) ? (
          <Box>
            <InformationFourLabels>{additionalInformationLabel}</InformationFourLabels>
            <B3CustomForm
              formFields={additionalInfo}
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
