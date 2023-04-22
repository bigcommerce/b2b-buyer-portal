import { SubmitHandler, useForm } from 'react-hook-form'
import { useB3Lang } from '@b3/lang'
import { Box, useTheme } from '@mui/material'

import { B3CustomForm, CustomButton } from '@/components'
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles'

import { getLoginFields, LoginConfig, LoginInfoInit } from './config'

interface LoginFormProps {
  loginInfo: Partial<LoginInfoInit>
  handleLoginSubmit: (data: LoginConfig) => void
  gotoForgotPassword: () => void
}

function LoginForm(props: LoginFormProps) {
  const { loginInfo, handleLoginSubmit, gotoForgotPassword } = props

  const b3Lang = useB3Lang()
  const theme = useTheme()

  const loginFields = getLoginFields(b3Lang)

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

  return (
    <Box
      sx={{
        width: '100%',
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
            color: getContrastColor(theme.palette.primary.main),
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
          }}
          onClick={() => gotoForgotPassword()}
        >
          {b3Lang('intl.user.login.loginText.forgotPasswordText')}
        </Box>
      </Box>
    </Box>
  )
}

export default LoginForm
