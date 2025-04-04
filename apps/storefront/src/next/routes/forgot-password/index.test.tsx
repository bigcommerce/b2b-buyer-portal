import { renderWithProviders } from 'tests/test-utils';

import { createForgotPassword } from '.';

it('passes translated strings into ForgotPasswordSection', async () => {
  const ForgotPasswordSection = vitest.fn().mockReturnValue(null);
  const ForgotPassword = createForgotPassword(ForgotPasswordSection);
  renderWithProviders(<ForgotPassword />);

  expect(ForgotPasswordSection.mock.calls[0][0]).toStrictEqual({
    title: 'Reset password',
    message: 'Please contact Customer Support in order to reset your password.',
  });
});
