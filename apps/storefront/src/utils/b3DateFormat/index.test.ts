import { store } from '@/store';

import { displayExtendedFormat, displayFormat } from '.';

describe('displayFormat', () => {
  const originalLocation = window.location;
  const FLAG = 'LOCAL-3509.Translate_b2b_dates';
  // 2026-09-12 15:30 UTC, formatted without offsets by using a zero store offset.
  const timestamp = Date.UTC(2026, 8, 12, 15, 30) / 1000;

  const LOCALES = [
    { code: 'en', isDefault: true, fullPath: 'https://store.example.com/' },
    { code: 'fr', isDefault: false, fullPath: 'https://store.example.com/fr' },
    { code: 'de', isDefault: false, fullPath: 'https://store.example.com/de' },
    { code: 'es', isDefault: false, fullPath: 'https://store.example.com/es' },
    { code: 'xx', isDefault: false, fullPath: 'https://store.example.com/xx' },
  ];

  const withDefault = (code: string) =>
    LOCALES.map((locale) => ({ ...locale, isDefault: locale.code === code }));
  const FRENCH_DEFAULT_LOCALES = withDefault('fr');
  const GERMAN_DEFAULT_LOCALES = withDefault('de');

  // The date shifted to store wall time, as formatCreator computes it (zero store offset).
  const localWallTime = new Date(
    timestamp * 1000 + new Date(timestamp * 1000).getTimezoneOffset() * 60000,
  );

  const mockState = (
    featureFlags: Record<string, boolean>,
    timeFormat: { display?: string; extendedDisplay?: string } = {},
    locales = LOCALES,
  ) =>
    vi.spyOn(store, 'getState').mockReturnValue({
      global: { featureFlags, locales },
      storeInfo: { timeFormat: { offset: 0, ...timeFormat } },
    } as unknown as ReturnType<typeof store.getState>);

  const setHref = (href: string) => {
    Object.defineProperty(window, 'location', { value: { href }, writable: true });
  };

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
    vi.restoreAllMocks();
  });

  it('keeps English month names when the date localization flag is off', () => {
    setHref('https://store.example.com/fr');
    mockState({ [FLAG]: false }, { display: 'j F Y' });

    expect(displayFormat(timestamp)).toBe('12 September 2026');
  });

  it('uses localized month names in the merchant token order for the default locale', () => {
    setHref('https://store.example.com/fr');
    mockState({ [FLAG]: true }, { display: 'j F Y' }, FRENCH_DEFAULT_LOCALES);

    expect(displayFormat(timestamp)).toBe('12 septembre 2026');
  });

  it('keeps the merchant token order with short month names for a default non-English locale', () => {
    setHref('https://store.example.com/fr');
    mockState({ [FLAG]: true }, { extendedDisplay: 'M j Y @ G:i' }, FRENCH_DEFAULT_LOCALES);

    expect(displayExtendedFormat(timestamp)).toBe('sept. 12 2026 @ 15:30');
  });

  it('localizes weekday names with the merchant format for a default locale', () => {
    setHref('https://store.example.com/de');
    mockState({ [FLAG]: true }, { display: 'l, j F Y' }, GERMAN_DEFAULT_LOCALES);

    expect(displayFormat(timestamp)).toBe('Samstag, 12 September 2026');
  });

  it('lets a non-default French locale decide the date part order', () => {
    setHref('https://store.example.com/fr');
    mockState({ [FLAG]: true }, { display: 'M j Y' });

    const result = displayFormat(timestamp) as string;

    expect(result).toBe(
      new Intl.DateTimeFormat('fr', { month: 'short', day: 'numeric', year: 'numeric' }).format(
        localWallTime,
      ),
    );
    expect(result.startsWith('12')).toBe(true);
  });

  it('lets a non-default German locale decide order and punctuation', () => {
    setHref('https://store.example.com/de');
    mockState({ [FLAG]: true }, { display: 'F j, Y' });

    const result = displayFormat(timestamp) as string;

    expect(result).toBe(
      new Intl.DateTimeFormat('de', { month: 'long', day: 'numeric', year: 'numeric' }).format(
        localWallTime,
      ),
    );
    expect(result.startsWith('12')).toBe(true);
  });

  it('lets a non-default locale decide the clock style in the extended format', () => {
    setHref('https://store.example.com/de');
    mockState({ [FLAG]: true }, { extendedDisplay: 'M j Y @ g:i A' });

    expect(displayExtendedFormat(timestamp)).toBe(
      new Intl.DateTimeFormat('de', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      }).format(localWallTime),
    );
  });

  it('falls back to the merchant format with localized names for unsupported tokens', () => {
    setHref('https://store.example.com/fr');
    mockState({ [FLAG]: true }, { display: 'N j F Y' });

    expect(displayFormat(timestamp)).toBe('6 12 septembre 2026');
  });

  it('keeps English output for the default locale when the flag is on', () => {
    setHref('https://store.example.com/');
    mockState({ [FLAG]: true }, { display: 'j M Y' });

    expect(displayFormat(timestamp)).toBe('12 Sep 2026');
  });

  it.each([
    { href: 'https://store.example.com/', date: Date.UTC(2026, 8, 1), expected: '1st September' },
    { href: 'https://store.example.com/', date: Date.UTC(2026, 8, 12), expected: '12th September' },
    { href: 'https://store.example.com/', date: Date.UTC(2026, 8, 22), expected: '22nd September' },
    { href: 'https://store.example.com/fr', date: Date.UTC(2026, 8, 1), expected: '1 septembre' },
    { href: 'https://store.example.com/fr', date: Date.UTC(2026, 8, 12), expected: '12 septembre' },
    { href: 'https://store.example.com/de', date: Date.UTC(2026, 8, 2), expected: '2 September' },
    { href: 'https://store.example.com/es', date: Date.UTC(2026, 8, 2), expected: '2 septiembre' },
    { href: 'https://store.example.com/xx', date: Date.UTC(2026, 8, 2), expected: '2 September' },
  ])('adds the day suffix only for English: $expected', ({ href, date, expected }) => {
    const code = href.endsWith('/') ? 'en' : (href.split('/').pop() ?? 'en');

    setHref(href);
    mockState({ [FLAG]: true }, { display: 'jS F' }, withDefault(code));

    expect(displayFormat(date / 1000)).toBe(expected);
  });

  it.each([
    { day: 1, expected: 'September 1st, 2026' },
    { day: 2, expected: 'September 2nd, 2026' },
    { day: 3, expected: 'September 3rd, 2026' },
    { day: 11, expected: 'September 11th, 2026' },
    { day: 12, expected: 'September 12th, 2026' },
    { day: 13, expected: 'September 13th, 2026' },
    { day: 22, expected: 'September 22nd, 2026' },
  ])(
    'keeps the English day suffix for a non-default English locale: $expected',
    ({ day, expected }) => {
      setHref('https://store.example.com/');
      mockState({ [FLAG]: true }, { display: 'jS F Y' }, FRENCH_DEFAULT_LOCALES);

      expect(displayFormat(Date.UTC(2026, 8, day) / 1000)).toBe(expected);
    },
  );

  it('adds the English day suffix to a two-digit day for a non-default English locale', () => {
    setHref('https://store.example.com/');
    mockState({ [FLAG]: true }, { display: 'dS M' }, FRENCH_DEFAULT_LOCALES);

    expect(displayFormat(Date.UTC(2026, 8, 1) / 1000)).toBe('Sep 01st');
  });

  it('drops the day suffix for a non-default non-English locale', () => {
    setHref('https://store.example.com/fr');
    mockState({ [FLAG]: true }, { display: 'jS F' });

    expect(displayFormat(Date.UTC(2026, 8, 1) / 1000)).toBe('1 septembre');
  });

  it('keeps English ordinal suffixes when the flag is off', () => {
    setHref('https://store.example.com/de');
    mockState({ [FLAG]: false }, { display: 'jS F' });

    expect(displayFormat(Date.UTC(2026, 8, 2) / 1000)).toBe('2nd September');
  });

  it('does not leak localized names into the English formatter afterwards', () => {
    setHref('https://store.example.com/fr');
    mockState({ [FLAG]: true }, { display: 'j F Y' });
    displayFormat(timestamp);

    mockState({ [FLAG]: false }, { display: 'j F Y' });

    expect(displayFormat(timestamp)).toBe('12 September 2026');
  });
});
