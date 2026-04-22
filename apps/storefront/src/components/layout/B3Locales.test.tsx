import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { renderWithProviders, screen } from 'tests/test-utils';

import { B3SStorage } from '@/utils/b3Storage';

import B3Locales from './B3Locales';

const LOCALES = [
  { code: 'en', isDefault: true },
  { code: 'fr', isDefault: false },
];

const withFlagEnabled = {
  global: buildGlobalStateWith({
    featureFlags: { 'LOCAL-3191.B2B_multi_language': true },
    availableLocales: LOCALES,
  }),
};

describe('when the multi-language feature flag is disabled', () => {
  it('renders nothing', () => {
    const { result } = renderWithProviders(<B3Locales />, {
      preloadedState: {
        global: buildGlobalStateWith({
          featureFlags: { 'LOCAL-3191.B2B_multi_language': false },
          availableLocales: LOCALES,
        }),
      },
      initialGlobalContext: { bcLanguage: 'en' },
    });

    expect(result.container).toBeEmptyDOMElement();
  });
});

describe('when there are 0 available locales', () => {
  it('renders nothing', () => {
    const { result } = renderWithProviders(<B3Locales />, {
      preloadedState: {
        global: buildGlobalStateWith({
          featureFlags: { 'LOCAL-3191.B2B_multi_language': true },
          availableLocales: [],
        }),
      },
      initialGlobalContext: { bcLanguage: 'en' },
    });

    expect(result.container).toBeEmptyDOMElement();
  });
});

describe('when there is only 1 available locale', () => {
  it('renders nothing', () => {
    const { result } = renderWithProviders(<B3Locales />, {
      preloadedState: {
        global: buildGlobalStateWith({
          featureFlags: { 'LOCAL-3191.B2B_multi_language': true },
          availableLocales: [{ code: 'en', isDefault: true }],
        }),
      },
      initialGlobalContext: { bcLanguage: 'en' },
    });

    expect(result.container).toBeEmptyDOMElement();
  });
});

describe('when the flag is enabled and multiple locales are available', () => {
  it('renders a dropdown button showing the current language in uppercase', () => {
    renderWithProviders(<B3Locales />, {
      preloadedState: withFlagEnabled,
      initialGlobalContext: { bcLanguage: 'en' },
    });

    expect(screen.getByRole('button', { name: /EN/i })).toBeInTheDocument();
  });

  it('persists the selected locale to storage and updates GlobalContext', async () => {
    const storageSpy = vi.spyOn(B3SStorage, 'set');
    const { user } = renderWithProviders(<B3Locales />, {
      preloadedState: withFlagEnabled,
      initialGlobalContext: { bcLanguage: 'en' },
    });

    await user.click(screen.getByRole('button', { name: /EN/i }));
    await user.click(screen.getByRole('menuitem', { name: 'FR' }));

    expect(storageSpy).toHaveBeenCalledWith('bcLanguage', 'fr');
    expect(screen.getByRole('button', { name: /FR/i })).toBeInTheDocument();
  });
});
