import { FormattedMessage } from 'react-intl';
import { buildGlobalStateWith, renderWithProviders, screen, waitFor } from 'tests/test-utils';

const TEST_KEY = 'test.langprovider.service.override';
const EN_DEFAULT = 'en-default-text';
const SERVICE_VALUE = 'service-translated-text';

function Msg() {
  return <FormattedMessage id={TEST_KEY} defaultMessage={EN_DEFAULT} />;
}

const withServiceTranslations = {
  translations: { [TEST_KEY]: SERVICE_VALUE },
  fetchedPages: ['global'],
  translationVersion: 1,
};

const setHref = (href: string) => {
  Object.defineProperty(window, 'location', { value: { href }, writable: true });
};

describe('LangProvider — service translation inclusion by locale type', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
  });

  it('includes service translations for the default locale', async () => {
    setHref('http://localhost/');
    renderWithProviders(<Msg />, {
      preloadedState: {
        global: buildGlobalStateWith({
          featureFlags: { 'LOCAL-3191.B2B_multi_language': true },
          locales: [{ code: 'en', isDefault: true, fullPath: 'http://localhost/' }],
        }),
        lang: withServiceTranslations,
      },
    });

    await waitFor(() => expect(screen.getByText(SERVICE_VALUE)).toBeVisible());
  });

  it('excludes service translations for a non-default locale that has a static bundle (fr)', async () => {
    setHref('http://localhost/fr');
    renderWithProviders(<Msg />, {
      preloadedState: {
        global: buildGlobalStateWith({
          featureFlags: { 'LOCAL-3191.B2B_multi_language': true },
          locales: [
            { code: 'en', isDefault: true, fullPath: 'http://localhost/' },
            { code: 'fr', isDefault: false, fullPath: 'http://localhost/fr' },
          ],
        }),
        lang: withServiceTranslations,
      },
    });

    await waitFor(() => expect(screen.getByText(EN_DEFAULT)).toBeVisible());
  });

  it('includes service translations for a non-default locale without a static bundle (ro)', async () => {
    setHref('http://localhost/ro');
    renderWithProviders(<Msg />, {
      preloadedState: {
        global: buildGlobalStateWith({
          featureFlags: { 'LOCAL-3191.B2B_multi_language': true },
          locales: [
            { code: 'en', isDefault: true, fullPath: 'http://localhost/' },
            { code: 'ro', isDefault: false, fullPath: 'http://localhost/ro' },
          ],
        }),
        lang: withServiceTranslations,
      },
    });

    await waitFor(() => expect(screen.getByText(SERVICE_VALUE)).toBeVisible());
  });
});
