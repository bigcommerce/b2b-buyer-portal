import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { renderWithProviders, screen } from 'tests/test-utils';

import B3LocaleSwitcher from './B3LocaleSwitcher';

const LOCALES = [
  { code: 'en', isDefault: true, fullPath: 'https://store.example.com/' },
  { code: 'fr', isDefault: false, fullPath: 'https://store.example.com/fr' },
];

const withFlagEnabled = {
  global: buildGlobalStateWith({
    featureFlags: { 'LOCAL-3191.B2B_multi_language': true },
    locales: LOCALES,
  }),
};

describe('when the multi-language feature flag is disabled', () => {
  it('renders nothing', () => {
    const { result } = renderWithProviders(<B3LocaleSwitcher />, {
      preloadedState: {
        global: buildGlobalStateWith({
          featureFlags: { 'LOCAL-3191.B2B_multi_language': false },
          locales: LOCALES,
        }),
      },
    });

    expect(result.container).toBeEmptyDOMElement();
  });
});

describe('when there are 0 available locales', () => {
  it('renders nothing', () => {
    const { result } = renderWithProviders(<B3LocaleSwitcher />, {
      preloadedState: {
        global: buildGlobalStateWith({
          featureFlags: { 'LOCAL-3191.B2B_multi_language': true },
          locales: [],
        }),
      },
    });

    expect(result.container).toBeEmptyDOMElement();
  });
});

describe('when there is only 1 available locale', () => {
  it('renders nothing', () => {
    const { result } = renderWithProviders(<B3LocaleSwitcher />, {
      preloadedState: {
        global: buildGlobalStateWith({
          featureFlags: { 'LOCAL-3191.B2B_multi_language': true },
          locales: [
            { code: 'en', isDefault: true, fullPath: 'https://store.example.com/' },
          ],
        }),
      },
    });

    expect(result.container).toBeEmptyDOMElement();
  });
});

describe('when the flag is enabled and multiple locales are available', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('renders a dropdown button showing the default language in uppercase when URL does not match any locale', () => {
    renderWithProviders(<B3LocaleSwitcher />, {
      preloadedState: withFlagEnabled,
    });

    expect(screen.getByRole('button', { name: /EN/i })).toBeInTheDocument();
  });

  it('shows the active locale derived from the current URL', () => {
    vi.stubGlobal('location', { href: 'https://store.example.com/fr/some-page' });

    renderWithProviders(<B3LocaleSwitcher />, {
      preloadedState: withFlagEnabled,
    });

    expect(screen.getByRole('button', { name: /FR/i })).toBeInTheDocument();
  });

  it('does not match a locale whose prefix is a substring of another path segment', () => {
    vi.stubGlobal('location', { href: 'https://store.example.com/frozen' });

    renderWithProviders(<B3LocaleSwitcher />, {
      preloadedState: withFlagEnabled,
    });

    expect(screen.getByRole('button', { name: /EN/i })).toBeInTheDocument();
  });

  it('matches locale when URL ends exactly at the fullPath', () => {
    vi.stubGlobal('location', { href: 'https://store.example.com/fr' });

    renderWithProviders(<B3LocaleSwitcher />, {
      preloadedState: withFlagEnabled,
    });

    expect(screen.getByRole('button', { name: /FR/i })).toBeInTheDocument();
  });

  it('matches locale when URL has a query string after the fullPath', () => {
    vi.stubGlobal('location', { href: 'https://store.example.com/fr?ref=email' });

    renderWithProviders(<B3LocaleSwitcher />, {
      preloadedState: withFlagEnabled,
    });

    expect(screen.getByRole('button', { name: /FR/i })).toBeInTheDocument();
  });

  it('navigates to the selected locale fullPath on change', async () => {
    const location = { href: 'https://store.example.com/#/orders', hash: '#/orders' };
    vi.stubGlobal('location', location);

    const { user } = renderWithProviders(<B3LocaleSwitcher />, {
      preloadedState: withFlagEnabled,
    });

    await user.click(screen.getByRole('button', { name: /EN/i }));
    await user.click(screen.getByRole('menuitem', { name: 'FR' }));

    expect(location.href).toBe('https://store.example.com/fr#/orders');
  });
});
