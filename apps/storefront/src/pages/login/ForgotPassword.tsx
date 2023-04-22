import { Dispatch, SetStateAction, useState } from 'react'
import { SubmitHandler, useForm } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import type { OpenPageState } from '@b3/hooks'
import { useB3Lang } from '@b3/lang'
import { Box, Grid } from '@mui/material'

import { B3Card, B3CustomForm, B3Sping, CustomButton } from '@/components'

import { getForgotPasswordFields, LoginConfig, sendEmail } from './config'

interface ForgotPasswordProps {
  setOpenPage: Dispatch<SetStateAction<OpenPageState>>
}

function ForgotPassword(props: ForgotPasswordProps) {
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
          mr: '25%',
          ml: '25%',
        }}
      >
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'center',
            fontSize: '25px',
            mt: 3,
            mb: 3,
          }}
        >
          {b3Lang('intl.user.forgot.forgotText.resetPassword')}
        </Box>
        <Box
          sx={{
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
            <Grid item xs={8}>
              <B3CustomForm
                formFields={forgotPasswordFields}
                errors={errors}
                control={control}
                getValues={getValues}
                setValue={setValue}
              />
            </Grid>

            <Grid item xs={4}>
              <Box
                sx={{
                  pl: 2,
                }}
              >
                <B3Sping isSpinning={isLoading} size={20}>
                  <CustomButton
                    type="submit"
                    size="medium"
                    onClick={handleSubmit(handleLoginClick)}
                    variant="contained"
                  >
                    {b3Lang('intl.user.forgot.forgotText.resetPasswordBtn')}
                  </CustomButton>
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
