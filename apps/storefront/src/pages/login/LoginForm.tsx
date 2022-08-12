import {
  useForm,
  SubmitHandler,
} from 'react-hook-form'

import {
  useB3Lang,
} from '@b3/lang'

import {
  Box,
} from '@mui/material'

import {
  B3CustomForm,
} from '@/components'

import {
  LoginInfoInit,
  getLoginFields,
  LoginConfig,
} from './config'

import {
  B3Button,
} from './styled'

interface LoginFormProps {
  loginInfo: Partial<LoginInfoInit>;
  handleLoginSubmit: (data: LoginConfig) => void;
  gotoForgotPassword: () => void;
}

const LoginForm = (props: LoginFormProps) => {
  const {
    loginInfo,
    handleLoginSubmit,
    gotoForgotPassword,
  } = props

  const b3Lang = useB3Lang()

  const loginFields = getLoginFields(b3Lang)

  const {
    loginBtn,
    btnColor,
  } = loginInfo

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

  const handleLoginClick: SubmitHandler<LoginConfig> = (data) => {
    handleLoginSubmit(data)
  }

  return (
    <Box sx={{
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

      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 2,
      }}
      >
        <B3Button
          btnColor={btnColor}
          type="submit"
          onClick={handleSubmit(handleLoginClick)}
          variant="contained"
        >
          { loginBtn }
        </B3Button>
        <Box
          sx={{
            cursor: 'pointer',
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
