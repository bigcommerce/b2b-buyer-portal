import { store } from '@/store';

import { withActiveLocaleUrl } from './withActiveLocaleUrl';

const LOCALES = [
  { code: 'fr', isDefault: true, fullPath: 'https://store.example.com/' },
  { code: 'es', isDefault: false, fullPath: 'https://store.example.com/es' },
];

const mockState = (locales = LOCALES) =>
  vi
    .spyOn(store, 'getState')
    .mockReturnValue({ global: { locales } } as unknown as ReturnType<typeof store.getState>);

const setHref = (href: string) => {
  Object.defineProperty(window, 'location', { value: { href }, writable: true });
};

describe('withActiveLocaleUrl', () => {
  const originalLocation = window.location;

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
    vi.restoreAllMocks();
  });

  it('prefixes the path with the active non-default locale subfolder', () => {
    setHref('https://store.example.com/es/some-page');
    mockState();

    expect(withActiveLocaleUrl('/producto-de-localizacion-es/')).toBe(
      '/es/producto-de-localizacion-es/',
    );
  });

  it('returns the path unchanged on the default locale', () => {
    setHref('https://store.example.com/some-page');
    mockState();

    expect(withActiveLocaleUrl('/test-localization-product/')).toBe('/test-localization-product/');
  });

  it('returns the path unchanged when no locale matches the current URL', () => {
    setHref('https://other-store.example.com/');
    mockState();

    expect(withActiveLocaleUrl('/some-product/')).toBe('/some-product/');
  });

  it('adds a leading slash if the path is missing one', () => {
    setHref('https://store.example.com/es/some-page');
    mockState();

    expect(withActiveLocaleUrl('producto/')).toBe('/es/producto/');
  });

  it('does not double-prefix a path that already carries the locale subfolder', () => {
    setHref('https://store.example.com/es/some-page');
    mockState();

    expect(withActiveLocaleUrl('/es/producto/')).toBe('/es/producto/');
  });

  it('returns an empty path unchanged', () => {
    setHref('https://store.example.com/es/some-page');
    mockState();

    expect(withActiveLocaleUrl('')).toBe('');
  });
});
