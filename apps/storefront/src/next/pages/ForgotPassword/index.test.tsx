import { renderWithProviders } from 'tests/test-utils';

import { ForgotPassword } from '.';
import { View } from './view';

vi.mock('./view', () => ({ View: vi.fn().mockReturnValue(null) }));

// Bit pointless at the moment without any I/O
it('renders the passed in View component', async () => {
  vitest.mocked(View).mockReturnValue('Mocked View');

  const { result } = renderWithProviders(<ForgotPassword />);

  expect(result.container.firstChild?.textContent).toBe('Mocked View');
});
