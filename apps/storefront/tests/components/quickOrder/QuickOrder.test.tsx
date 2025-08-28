import QuickOrder from '@/pages/QuickOrder';
import { renderWithProviders, screen } from 'tests/test-utils';

import { mockActiveCurrency, mockCurrencies } from './mock';

vi.mock('date-fns', () => ({
  format: vi.fn(),
  subDays: vi.fn(),
}));

describe('QuickOrder component', () => {
  beforeEach(() => {
    window.sessionStorage.setItem('sf-activeCurrency', mockActiveCurrency);
    window.sessionStorage.setItem('sf-currencies', mockCurrencies);
  });

  it('renders correctly', async () => {
    renderWithProviders(<QuickOrder />);

    const title = await screen.findByText('0 products');

    expect(title).toBeInTheDocument();
  });
});
