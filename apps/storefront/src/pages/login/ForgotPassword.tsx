import { Dispatch, SetStateAction, useContext, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import type { OpenPageState } from '@b3/hooks'
import { useB3Lang } from '@b3/lang'
import { Box, ImageListItem, Typography } from '@mui/material'

import { B3Card, B3CustomForm, B3Sping, CustomButton } from '@/components'
import { useMobile } from '@/hooks'
import { CustomStyleContext } from '@/shared/customStyleButtton'
import { GlobaledContext } from '@/shared/global'

import { getForgotPasswordFields, LoginConfig, sendEmail } from './config'
import { B3ResetPassWordButton, LoginImage } from './styled'

interface ForgotPasswordProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

function ForgotPassword(props: ForgotPasswordProps) {
  const {
    state: { logo },
  } = useContext(GlobaledContext)

  const {
    state: {
      loginPageDisplay: { displayStoreLogo },
    },
  } = useContext(CustomStyleContext)

  const [isMobile] = useMobile()
  const [isLoading, setLoading] = useState<boolean>(false)
  const b3Lang = useB3Lang()
  const forgotPasswordFields = getForgotPasswordFields(b3Lang)

  const { setOpenPage } = props

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
  } = useForm<LoginConfig>({
    mode: 'onSubmit',
  })

  const navigate = useNavigate()

  const handleLoginClick: SubmitHandler<LoginConfig> = async (data) => {
    setLoading(true)
    const { emailAddress } = data
    try {
      await sendEmail(emailAddress)
      setLoading(false)
      navigate('/login?loginFlag=2')
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <B3Card setOpenPage={setOpenPage}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          mr: 'auto',
          ml: 'auto',
          maxWidth: '537px',
        }}
      >
        {logo && displayStoreLogo && (
          <LoginImage>
            <ImageListItem
              sx={{
                maxWidth: isMobile ? '175px' : '250px',
                maxHeight: isMobile ? '175px' : '250px',
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
          </LoginImage>
        )}
        <Box
          sx={{
            bgcolor: '#FFFFFF',
            borderRadius: '4px',
            margin: '30px 0 0 0',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <Typography
            variant="h5"
            sx={{
              margin: '16px 0',
            }}
          >
            {b3Lang('intl.user.forgot.forgotText.resetPassword')}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              margin: '0 16px 16px 16px',
            }}
          >
            {b3Lang('intl.user.forgot.forgotText.requestEmail')}
          </Typography>
          <B3CustomForm
            formFields={forgotPasswordFields}
            errors={errors}
            control={control}
            getValues={getValues}
            setValue={setValue}
            sx={{ margin: '0 16px', maxWidth: isMobile ? '311px' : '505px' }}
          />
          <B3Sping isSpinning={isLoading} size={20}>
            <B3ResetPassWordButton>
              <CustomButton
                type="submit"
                size="medium"
                onClick={handleSubmit(handleLoginClick)}
                variant="contained"
              >
                {b3Lang('intl.user.forgot.forgotText.resetPasswordBtn')}
              </CustomButton>
            </B3ResetPassWordButton>
          </B3Sping>
        </Box>
      </Box>
    </B3Card>
  )
}

export default ForgotPassword
