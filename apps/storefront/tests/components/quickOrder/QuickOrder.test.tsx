import { beforeEach, describe, it, vi } from 'vitest'

import { ThemeFrame } from '@/components'
import Quickorder from '@/pages/quickorder/Quickorder'
import { GlobalProvider } from '@/shared/global'
import global from '@/store/slices/global'
import theme from '@/store/slices/theme'

import { renderWithProviders } from '../../test-utils'

import { mockActiveCurrency, mockCurrencies } from './mock'

vi.mock('react-intl', () => ({
  useIntl: vi.fn(() => ({ formatMessage: vi.fn() })),
}))

vi.mock('react-router-dom', () => ({
  useNavigate: vi.fn(),
}))

vi.mock('date-fns', () => ({
  format: vi.fn(),
  subDays: vi.fn(),
}))

describe('Quickorder component', () => {
  beforeEach(() => {
    window.sessionStorage.setItem('sf-activeCurrency', mockActiveCurrency)
    window.sessionStorage.setItem('sf-currencies', mockCurrencies)
  })

  it('renders correctly', () => {
    renderWithProviders(
      <GlobalProvider>
        <ThemeFrame title="test-frame">
          <Quickorder />
        </ThemeFrame>
      </GlobalProvider>,
      {
        reducers: { global, theme },
      }
    )
  })
})
