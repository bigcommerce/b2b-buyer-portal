/* eslint-disable react/function-component-definition */
import { FC } from 'react';
import { ForgotPasswordSection } from '../../sections/ForgotPassword';
import { withinModal } from '@/next/withinModal';
import { useB3Lang } from '@b3/lang';

type ForgotPasswordSectionType = typeof ForgotPasswordSection;
type CreateForgotPassword = (ForgotPasswordSection: ForgotPasswordSectionType) => FC;

// Vitest won't let you mock imports used within another module
// i.e. you can't spy on ForgotPasswordSection while testing this module
// you're forced to call through (and your test becomes coupled to the implementation)

// or

// you turn the unit under test into a kind of "factory" function (as here)

// ooooorr

// you think of these "Page" modules as more config than code
// either not testing them at all, or doing so in a more integration style via playwright
export const createForgotPassword: CreateForgotPassword = (ForgotPasswordSection) => () => {
  const b3Lang = useB3Lang();

  return (
    <ForgotPasswordSection
      // In Catalyst, text is passed in as if it is I/O
      title={b3Lang('forgotPassword.resetPassword')}
      // Pretend this was a translation string too
      message={'Please contact Customer Support in order to reset your password.'}
    />
  );
};

export default withinModal(createForgotPassword(ForgotPasswordSection));
