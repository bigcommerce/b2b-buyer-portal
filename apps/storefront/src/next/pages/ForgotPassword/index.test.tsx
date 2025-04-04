import { renderWithProviders } from 'tests/test-utils';

import { createForgotPassword } from '.';

// Bit pointless at the moment without any I/O
it('renders the passed in View component', async () => {
  const viewReturn = 'MOCKED_VIEW';
  const View = vitest.fn().mockReturnValue(viewReturn);
  const ForgotPassword = createForgotPassword(View);
  const { result } = renderWithProviders(<ForgotPassword />);

  expect(View).toHaveBeenCalled();
  expect(result.container.firstChild?.textContent).toBe(viewReturn);
});
