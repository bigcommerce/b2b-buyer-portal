import { renderWithProviders } from 'tests/test-utils';

import { ForgotPassword } from '.';
import { View } from './view';
import { resetPassword } from './resetPassword';

vi.mock('./view', () => ({ View: vi.fn().mockReturnValue(null) }));

// Bit pointless at the moment without any I/O
it('renders the passed in View component', async () => {
  const viewMock = vitest.mocked(View).mockReturnValue('Mocked View');

  const { result } = renderWithProviders(<ForgotPassword />);

  const viewProps = viewMock.mock.calls[0][0];

  expect(viewProps).toStrictEqual({ resetPassword });
  expect(result.container.firstChild?.textContent).toBe('Mocked View');
});
