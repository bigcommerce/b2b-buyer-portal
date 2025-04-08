/* eslint-disable react/function-component-definition */
import { FC } from 'react';
import { useB3Lang } from '@b3/lang';
import { Alert, Box, Button, TextField, Typography } from '@mui/material';
import { useForm } from './useForm';
import { useNavigate } from 'react-router-dom';

// Pages shared between Stencil and Catalyst would need
// - a solution to swap styled component libraries
// - a solution to populate app level state (globals like logo, etc)
// - a solution to share/provide own translations (catalyst passes strings in as props)
// - catalyst has gone all in on `conform`: https://conform.guide/ - might dictate our I/O signatures
//   - worse than that, this seems to either not work or need lots of hacks to work client side
// Catalyst version: https://github.com/bigcommerce/catalyst/blob/17d72cac3c1183f78856f3f4af99312695fa5b26/core/vibes/soul/sections/forgot-password-section/index.tsx

export type ResetPassword = (emailAddress: string) => Promise<void>;

interface Props {
  resetPassword: ResetPassword;
}

export const View: FC<Props> = ({ resetPassword }) => {
  const b3Lang = useB3Lang();
  const navigate = useNavigate();

  const { register, handleSubmit, formState, setError } = useForm();

  const navigateToLogin = () => navigate('/login?loginFlag=receivePassword');
  const setSubmitError = () =>
    setError('root', { message: 'Failed to process your request. Please try again later.' });

  const submit = handleSubmit(({ emailAddress }) =>
    resetPassword(emailAddress).then(navigateToLogin).catch(setSubmitError),
  );

  return (
    <Box
      sx={{
        bgcolor: '#FFFFFF',
        borderRadius: '4px',
        marginX: 'auto',
        maxWidth: '537px',
        padding: '20px',
      }}
    >
      {formState.errors.root && (
        <Box marginBottom="16px">
          <Alert severity="error">{formState.errors.root.message}</Alert>
        </Box>
      )}
      <Typography variant="h5" sx={{ marginBottom: '16px', textAlign: 'center' }}>
        {b3Lang('forgotPassword.resetPassword')}
      </Typography>
      <Typography variant="body1" marginBottom="16px">
        {b3Lang('forgotPassword.requestEmail')}
      </Typography>
      <form onSubmit={submit}>
        <Box marginBottom="16px">
          <TextField
            fullWidth
            {...register('emailAddress', { required: true })}
            label={b3Lang('global.loginText.emailAddress')}
            variant="filled"
            error={formState.errors.emailAddress !== undefined}
            helperText={formState.errors.emailAddress?.message}
          />
        </Box>
        <Button type="submit" variant="contained" disabled={formState.isSubmitting}>
          {b3Lang('forgotPassword.resetPasswordBtn')}
        </Button>
      </form>
    </Box>
  );
};
