import { useB3Lang } from '@b3/lang';
import { Box, Button, Link, Typography, useTheme } from '@mui/material';
import { SubmitHandler, useForm } from 'react-hook-form';
import { Link as RouterLink } from 'react-router-dom';

import { B3CustomForm } from '@/components';
import { getContrastColor } from '@/components/outSideComponents/utils/b3CustomStyles';

import { getLoginFields, LoginConfig } from './config';

interface LoginFormProps {
  loginBtn: string;
  handleLoginSubmit: (data: LoginConfig) => void;
  backgroundColor: string;
}

function LoginForm(props: LoginFormProps) {
  const { loginBtn, handleLoginSubmit, backgroundColor } = props;

  const b3Lang = useB3Lang();
  const theme = useTheme();

  const {
    control,
    handleSubmit,
    getValues,
    formState: { errors },
    setValue,
  } = useForm<LoginConfig>({
    mode: 'onSubmit',
  });

  const handleLoginClick: SubmitHandler<LoginConfig> = (data) => {
    handleLoginSubmit(data);
  };

  const loginFields = getLoginFields(b3Lang, handleSubmit(handleLoginClick));

  return (
    <Box
      sx={{
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <Typography
        sx={{
          margin: '20px 0',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
        }}
        variant="h5"
      >
        {b3Lang('login.loginText.signInHeader')}
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
        <form onSubmit={handleSubmit(handleLoginClick)}>
          <B3CustomForm
            control={control}
            errors={errors}
            formFields={loginFields}
            getValues={getValues}
            setValue={setValue}
          />
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'flex-start ',
              alignItems: 'center',
              mt: 2,
              gap: 2,
            }}
          >
            <Button
              sx={{
                backgroundColor: theme.palette.primary.main,
              }}
              type="submit"
              variant="contained"
            >
              {loginBtn}
            </Button>
            <Link
              color={getContrastColor(backgroundColor)}
              component={RouterLink}
              to="/forgotPassword"
            >
              {b3Lang('login.loginText.forgotPasswordText')}
            </Link>
          </Box>
        </form>
      </Box>
    </Box>
  );
}

export default LoginForm;
