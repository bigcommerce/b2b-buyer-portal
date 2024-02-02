import { SubmitHandler, useForm } from 'react-hook-form'
import { useB3Lang } from '@b3/lang'
import { Box, Typography, useTheme } from '@mui/material'

import { B3CustomForm, CustomButton } from '@/components'
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles'

import { getLoginFields, LoginConfig, LoginInfoInit } from './config'

interface LoginFormProps {
  loginInfo: Partial<LoginInfoInit>
  handleLoginSubmit: (data: LoginConfig) => void
  gotoForgotPassword: () => void
  backgroundColor: string
}

function LoginForm(props: LoginFormProps) {
  const { loginInfo, handleLoginSubmit, gotoForgotPassword, backgroundColor } =
    props

  const b3Lang = useB3Lang()
  const theme = useTheme()

  const { loginBtn } = loginInfo

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
  } = useForm<LoginConfig>({
    mode: 'onSubmit',
  })

  const handleLoginClick: SubmitHandler<LoginConfig> = (data) => {
    handleLoginSubmit(data)
  }

  const loginFields = getLoginFields(b3Lang, handleSubmit(handleLoginClick))

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        variant="h5"
        sx={{
          margin: '20px 0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        Sign in
      </Typography>
      <Box
        sx={{
          width: '100%',
          '& input': {
            bgcolor: '#F5F5F5',
            borderRadius: '4px',
            borderBottomLeftRadius: '0',
            borderBottomRightRadius: '0',
          },
        }}
      >
        <B3CustomForm
          formFields={loginFields}
          errors={errors}
          control={control}
          getValues={getValues}
          setValue={setValue}
        />

        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-start ',
            alignItems: 'center',
            mt: 2,
          }}
        >
          <CustomButton
            type="submit"
            onClick={handleSubmit(handleLoginClick)}
            variant="contained"
            sx={{
              backgroundColor: theme.palette.primary.main,
            }}
          >
            {loginBtn}
          </CustomButton>
          <Box
            sx={{
              cursor: 'pointer',
              ml: 2,
              textDecoration: 'underline',
              textUnderlineOffset: '4px',
              color: getContrastColor(backgroundColor),
            }}
            onClick={() => gotoForgotPassword()}
          >
            {b3Lang('login.loginText.forgotPasswordText')}
          </Box>
        </Box>
      </Box>
    </Box>
  )
}

export default LoginForm
