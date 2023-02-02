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
  checkUserEmail,
  checkUserBCEmail,
} from '@/shared/service/b2b'

import {
  RegisteredContext,
} from './context/RegisteredContext'

import {
  GlobaledContext,
} from '@/shared/global'

import {
  RegisterFields,
  emailError,
} from './config'

import {
  InformationFourLabels, TipContent,
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
    state: {
      currentChannelId,
    },
  } = useContext(GlobaledContext)

  const {
    state,
    dispatch,
  } = useContext(RegisteredContext)

  const b3Lang = useB3Lang()

  const [errorTips, setErrorTips] = useState<string>('')

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
    setError,
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

  const emailName = contactInformation?.find((item: CustomFieldItems) => item.fieldId === 'field_email')?.name || 'email'

  const validateEmailValue = async (emailValue: string) => {
    const isB2BUser = accountType === '1'
    const fn = isB2BUser ? checkUserEmail : checkUserBCEmail
    const key = isB2BUser ? 'userEmailCheck' : 'customerEmailCheck'

    const {
      [key]: {
        userType,
        userInfo: {
          companyName = '',
        } = {},
      },
    }: CustomFieldItems = await fn({
      email: emailValue,
      channelId: currentChannelId,
    })

    const isValid = isB2BUser ? [1].includes(userType) : ![2].includes(userType)

    if (!isValid) {
      setErrorTips(b3Lang(emailError[userType], {
        companyName: companyName || '',
        email: emailValue,
      }))
      setError(emailName, {
        type: 'custom',
        message: '',
      })

      const iframe: HTMLIFrameElement | null = window.document.querySelector('.active-frame')
      if (iframe) {
        iframe.contentWindow?.document.body.scrollIntoView(true)
      }
    } else {
      setErrorTips('')
    }

    return isValid
  }

  const handleAccountToDetail = async (event: MouseEvent) => {
    handleSubmit(async (data: CustomFieldItems) => {
      if (!await validateEmailValue(data[emailName])) {
        return
      }

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

      dispatch({
        type: 'all',
        payload: {
          [additionName]: [...newAdditionalInformation],
          [contactName]: [...newContactInfo],
        },
      })
      handleNext()
    })(event)
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
        errorTips && (
        <Alert
          severity="error"
        >
          <TipContent>
            {errorTips}
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
