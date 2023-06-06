import { ChangeEvent, MouseEvent, useContext, useState } from 'react'
import { useForm } from 'react-hook-form'
import { useSelector } from 'react-redux'
import { useB3Lang } from '@b3/lang'
import {
  Alert,
  Box,
  FormControl,
  FormControlLabel,
  Radio,
  RadioGroup,
} from '@mui/material'

import { B3CustomForm } from '@/components'
import {
  b3HexToRgb,
  getContrastColor,
} from '@/components/outSideComponents/utils/b3CustomStyles'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'
import { checkUserBCEmail, checkUserEmail } from '@/shared/service/b2b'
import { themeFrameSelector } from '@/store'

import RegisteredStepButton from './component/RegisteredStepButton'
import { RegisteredContext } from './context/RegisteredContext'
import { emailError, RegisterFields } from './config'
import { InformationFourLabels, TipContent } from './styled'

interface RegisteredAccountProps {
  handleBack: () => void
  handleNext: () => void
  activeStep: number
}

export default function RegisteredAccount(props: RegisteredAccountProps) {
  const { handleBack, handleNext, activeStep } = props

  const {
    state: { currentChannelId },
  } = useContext(GlobaledContext)

  const { state, dispatch } = useContext(RegisteredContext)
  const IframeDocument = useSelector(themeFrameSelector)

  const {
    state: {
      accountLoginRegistration,
      portalStyle: { backgroundColor = '#FEF9F5' },
    },
  } = useContext(CustomStyleContext)

  const customColor = getContrastColor(backgroundColor)

  const b3Lang = useB3Lang()

  const [errorTips, setErrorTips] = useState<string>('')

  const {
    contactInformation,
    accountType,
    additionalInformation,
    bcContactInformation,
    bcAdditionalInformation,
  } = state

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setError,
    setValue,
  } = useForm({
    mode: 'onSubmit',
  })

  const additionName =
    accountType === '1' ? 'additionalInformation' : 'bcAdditionalInformation'
  const additionalInfo: any =
    accountType === '1' ? additionalInformation : bcAdditionalInformation

  const contactInfo: any =
    accountType === '1' ? contactInformation : bcContactInformation
  const contactName =
    accountType === '1' ? 'contactInformation' : 'bcContactInformationFields'

  const contactInformationLabel = contactInfo.length
    ? contactInfo[0]?.groupName
    : ''

  const additionalInformationLabel = additionalInfo.length
    ? additionalInfo[0]?.groupName
    : ''

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'accountType',
      payload: {
        accountType: event.target.value,
      },
    })
  }

  const emailName =
    contactInformation?.find(
      (item: CustomFieldItems) => item.fieldId === 'field_email'
    )?.name || 'email'

  const validateEmailValue = async (emailValue: string) => {
    const isB2BUser = accountType === '1'
    const fn = isB2BUser ? checkUserEmail : checkUserBCEmail
    const key = isB2BUser ? 'userEmailCheck' : 'customerEmailCheck'

    const {
      [key]: { userType, userInfo: { companyName = '' } = {} },
    }: CustomFieldItems = await fn({
      email: emailValue,
      channelId: currentChannelId,
    })

    const isValid = isB2BUser ? [1].includes(userType) : ![2].includes(userType)

    if (!isValid) {
      setErrorTips(
        b3Lang(emailError[userType], {
          companyName: companyName || '',
          email: emailValue,
        })
      )
      setError(emailName, {
        type: 'custom',
        message: '',
      })

      IframeDocument?.body.scrollIntoView(true)
    } else {
      setErrorTips('')
    }

    return isValid
  }

  const handleAccountToDetail = async (event: MouseEvent) => {
    handleSubmit(async (data: CustomFieldItems) => {
      if (!(await validateEmailValue(data[emailName]))) {
        return
      }

      const newContactInfo = contactInfo.map((item: RegisterFields) => {
        item.default = data[item.name] || item.default
        return item
      })

      let newAdditionalInformation: Array<RegisterFields> = []
      if (additionalInfo) {
        newAdditionalInformation = (
          additionalInfo as Array<RegisterFields>
        ).map((item: RegisterFields) => {
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
        pl: 1,
        pr: 1,
        mt: 2,
        width: '100%',
      }}
    >
      {errorTips && (
        <Alert severity="error">
          <TipContent>{errorTips}</TipContent>
        </Alert>
      )}

      <FormControl
        sx={{
          '& h4': {
            color: customColor,
          },
        }}
      >
        <InformationFourLabels>
          {b3Lang('intl.user.register.registeredAccount.accountType')}
        </InformationFourLabels>
        <RadioGroup
          row
          aria-labelledby="demo-row-radio-buttons-group-label"
          name="row-radio-buttons-group"
          value={accountType}
          onChange={handleChange}
          sx={{
            '& .MuiTypography-root.MuiTypography-body1.MuiFormControlLabel-label':
              {
                color: b3HexToRgb(customColor, 0.87),
              },
            '& .MuiButtonBase-root.MuiRadio-root.MuiRadio-colorPrimary:not(.Mui-checked)':
              {
                color: b3HexToRgb(customColor, 0.6),
              },
          }}
        >
          {accountLoginRegistration.b2b && (
            <FormControlLabel
              value="1"
              control={<Radio />}
              label={b3Lang(
                'intl.user.register.registeredAccount.businessAccount'
              )}
            />
          )}
          {accountLoginRegistration.b2c && (
            <FormControlLabel
              value="2"
              control={<Radio />}
              label={b3Lang(
                'intl.user.register.registeredAccount.personalAccount'
              )}
            />
          )}
        </RadioGroup>
      </FormControl>

      <Box
        sx={{
          '& h4': {
            color: customColor,
          },
          '& input, & .MuiFormControl-root .MuiTextField-root, & .MuiTextField-root .MuiInputBase-multiline':
            {
              bgcolor: b3HexToRgb('#FFFFFF', 0.87),
              borderRadius: '4px',
              borderBottomLeftRadius: '0',
              borderBottomRightRadius: '0',
            },
          '& .MuiButtonBase-root.MuiCheckbox-root.MuiCheckbox-colorPrimary:not(.Mui-checked)':
            {
              color: b3HexToRgb(customColor, 0.6),
            },
          '& .MuiTypography-root.MuiTypography-body1.MuiFormControlLabel-label':
            {
              color: b3HexToRgb(customColor, 0.87),
            },
        }}
      >
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
      {additionalInfo && additionalInfo.length ? (
        <Box
          sx={{
            '& h4': {
              color: customColor,
            },
            '& .MuiFormControlLabel-label, & .MuiFormControl-root .MuiFormLabel-root:not(.Mui-focused)':
              {
                color: b3HexToRgb(customColor, 0.87),
              },
            '& .MuiRadio-root:not(.Mui-checked)': {
              color: b3HexToRgb(customColor, 0.6),
            },
          }}
        >
          <InformationFourLabels>
            {additionalInformationLabel}
          </InformationFourLabels>
          <B3CustomForm
            formFields={additionalInfo}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
          />
        </Box>
      ) : (
        ''
      )}

      <RegisteredStepButton
        activeStep={activeStep}
        handleBack={handleBack}
        handleNext={handleAccountToDetail}
      />
    </Box>
  )
}
