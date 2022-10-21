import {
  useState,
  Dispatch,
  SetStateAction,
} from 'react'

import {
  Box,
  Grid,
} from '@mui/material'

import {
  useForm,
  SubmitHandler,
} from 'react-hook-form'

import {
  useB3Lang,
} from '@b3/lang'

import type {
  OpenPageState,
} from '@b3/hooks'

import {
  useNavigate,
} from 'react-router-dom'

import {
  getForgotPasswordFields,
  sendEmail,
  LoginConfig,
} from './config'

import {
  B3CustomForm,
  B3Sping,
  B3Card,
} from '@/components'

import {
  B3ForgotButton,
} from './styled'

interface ForgotPasswordProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>,
}

const ForgotPassword = (props: ForgotPasswordProps) => {
  const [isLoading, setLoading] = useState<boolean>(false)
  const b3Lang = useB3Lang()
  const forgotPasswordFields = getForgotPasswordFields(b3Lang)

  const {
    setOpenPage,
  } = props

  const {
    control,
    handleSubmit,
    getValues,
    formState: {
      errors,
    },
    setValue,
  } = useForm<LoginConfig>({
    mode: 'onSubmit',
  })

  const navigate = useNavigate()

  const handleLoginClick: SubmitHandler<LoginConfig> = async (data) => {
    setLoading(true)
    const {
      emailAddress,
    } = data
    try {
      await sendEmail(emailAddress)
      setLoading(false)
      navigate('/login?loginFlag=2')
    } catch (e) {
      // eslint-disable-next-line no-console
      console.log(e)
    }
  }

  return (
    <B3Card setOpenPage={setOpenPage}>
      <Box sx={{
        mr: '25%',
        ml: '25%',
      }}
      >
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          fontSize: '25px',
          mt: 3,
          mb: 3,
        }}
        >
          {b3Lang('intl.user.forgot.forgotText.resetPassword')}
        </Box>
        <Box sx={{
          display: 'flex',
          justifyContent: 'center',
          mt: '50px',
          mb: '50px',
        }}
        >
          {b3Lang('intl.user.forgot.forgotText.requestEmail')}
        </Box>

        <Box>
          <Grid container>
            <Grid
              item
              xs={8}
            >
              <B3CustomForm
                formFields={forgotPasswordFields}
                errors={errors}
                control={control}
                getValues={getValues}
                setValue={setValue}
              />
            </Grid>

            <Grid
              item
              xs={4}
            >
              <Box sx={{
                pl: 2,
              }}
              >
                <B3Sping
                  isSpinning={isLoading}
                  size={20}
                >
                  <B3ForgotButton
                    type="submit"
                    size="medium"
                    onClick={handleSubmit(handleLoginClick)}
                    variant="contained"
                  >
                    {b3Lang('intl.user.forgot.forgotText.resetPasswordBtn')}
                  </B3ForgotButton>
                </B3Sping>

              </Box>

            </Grid>

          </Grid>
        </Box>
      </Box>
    </B3Card>
  )
}

export default ForgotPassword
