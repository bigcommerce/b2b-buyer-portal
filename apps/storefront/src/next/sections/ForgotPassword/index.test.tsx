import { faker } from '@faker-js/faker';

import { renderWithProviders, screen } from 'tests/test-utils';

import { ForgotPasswordSection } from './';

// Not a fan of passing in the strings
// it seems to strip the component of its meaning
// makes its parent responsible for some very key things to the user experience
it('displays the specified heading', async () => {
  const title = 'Reset password';
  renderWithProviders(<ForgotPasswordSection title={title} message={faker.lorem.paragraph()} />);

  screen.getByRole('heading', { name: 'Reset password' });
});

it('displays the specified message', async () => {
  const message = 'Please contact Customer Support in order to reset your password.';
  renderWithProviders(<ForgotPasswordSection message={message} title={faker.lorem.text()} />);

  screen.getByText('Please contact Customer Support in order to reset your password.');
});
