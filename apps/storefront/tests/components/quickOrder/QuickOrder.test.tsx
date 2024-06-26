import { renderWithProviders } from 'tests/test-utils';

import { ThemeFrame } from '@/components';
import Quickorder from '@/pages/QuickOrder';
import { GlobalProvider } from '@/shared/global';

import { mockActiveCurrency, mockCurrencies } from './mock';

vi.mock('react-intl', () => ({
  useIntl: vi.fn(() => ({ formatMessage: vi.fn() })),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}));

vi.mock('date-fns', () => ({
  format: vi.fn(),
  subDays: vi.fn(),
}));

describe('Quickorder component', () => {
  beforeEach(() => {
    window.sessionStorage.setItem('sf-activeCurrency', mockActiveCurrency);
    window.sessionStorage.setItem('sf-currencies', mockCurrencies);
  });

  it('renders correctly', () => {
    renderWithProviders(
      <GlobalProvider>
        <ThemeFrame title="test-frame">
          <Quickorder />
        </ThemeFrame>
      </GlobalProvider>,
    );
  });
});
