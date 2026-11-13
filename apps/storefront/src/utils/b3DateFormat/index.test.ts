import { store } from '@/store';

import { displayExtendedFormat, displayFormat } from '.';

describe('displayFormat', () => {
  const originalLocation = window.location;
  const FLAG = 'LOCAL-3509.Translate_b2b_dates';
  const STORE_URL = 'https://store.example.com';
  // 2026-09-12 15:30 UTC, formatted without offsets by using a zero store offset.
  const timestamp = Date.UTC(2026, 8, 12, 15, 30) / 1000;
  const firstOfSeptember = Date.UTC(2026, 8, 1) / 1000;

  const buildLocales = (...codes: string[]) => [
    { code: 'en', isDefault: true, fullPath: `${STORE_URL}/` },
    ...codes.map((code) => ({ code, isDefault: false, fullPath: `${STORE_URL}/${code}` })),
  ];

  const mockState = (
    featureFlags: Record<string, boolean>,
    timeFormat: { display?: string; extendedDisplay?: string } = {},
  ) =>
    vi.spyOn(store, 'getState').mockReturnValue({
      global: { featureFlags, locales: buildLocales('fr', 'de', 'es', 'uk', 'ja') },
      storeInfo: { timeFormat: { offset: 0, ...timeFormat } },
    } as unknown as ReturnType<typeof store.getState>);

  const visit = (path: string) => {
    Object.defineProperty(window, 'location', {
      value: { href: `${STORE_URL}${path}` },
      writable: true,
    });
  };

  afterEach(() => {
    Object.defineProperty(window, 'location', { value: originalLocation, writable: true });
    vi.restoreAllMocks();
  });

  it('keeps English month names when the date localization flag is off', () => {
    visit('/fr');
    mockState({ [FLAG]: false }, { display: 'j F Y' });

    expect(displayFormat(timestamp)).toBe('12 September 2026');
  });

  it('translates month names while keeping the merchant order', () => {
    visit('/fr');
    mockState({ [FLAG]: true }, { display: 'j F Y' });

    expect(displayFormat(timestamp)).toBe('12 septembre 2026');
  });

  it('keeps the merchant order with short month names', () => {
    visit('/fr');
    mockState({ [FLAG]: true }, { extendedDisplay: 'M j Y @ G:i' });

    expect(displayExtendedFormat(timestamp)).toBe('sept. 12 2026 @ 15:30');
  });

  it('keeps the month unit in long month names (F) for languages that write months as numbers', () => {
    visit('/ja');
    mockState({ [FLAG]: true }, { display: 'j F Y' });

    expect(displayFormat(timestamp)).toBe('12 9月 2026');
  });

  it('keeps the month unit in short month names (M) for languages that write months as numbers', () => {
    visit('/ja');
    mockState({ [FLAG]: true }, { display: 'j M Y' });

    expect(displayFormat(timestamp)).toBe('12 9月 2026');
  });

  it('translates weekday names in the merchant format', () => {
    visit('/de');
    mockState({ [FLAG]: true }, { display: 'l, j F Y' });

    expect(displayFormat(timestamp)).toBe('Samstag, 12 September 2026');
  });

  it('renders a numeric day.month.year merchant format the same in a translated language', () => {
    visit('/de');
    mockState({ [FLAG]: true }, { display: 'd.m.Y' });

    expect(displayFormat(firstOfSeptember)).toBe('01.09.2026');
  });

  it('keeps English output on the English storefront when the flag is on', () => {
    visit('/');
    mockState({ [FLAG]: true }, { display: 'j M Y' });

    expect(displayFormat(timestamp)).toBe('12 Sep 2026');
  });

  it('keeps English output for a language the portal ships no translations for', () => {
    visit('/uk');
    mockState({ [FLAG]: true }, { display: 'jS F Y' });

    expect(displayFormat(firstOfSeptember)).toBe('1st September 2026');
  });

  it('keeps the English day suffix on the English storefront', () => {
    visit('/');
    mockState({ [FLAG]: true }, { display: 'jS F Y' });

    expect(displayFormat(firstOfSeptember)).toBe('1st September 2026');
  });

  it('drops the day suffix for a translated language', () => {
    visit('/fr');
    mockState({ [FLAG]: true }, { display: 'jS F Y' });

    expect(displayFormat(firstOfSeptember)).toBe('1 septembre 2026');
  });

  it('keeps the English day suffix when the flag is off', () => {
    visit('/de');
    mockState({ [FLAG]: false }, { display: 'jS F' });

    expect(displayFormat(Date.UTC(2026, 8, 2) / 1000)).toBe('2nd September');
  });

  it('does not leak translated names into the English formatter afterwards', () => {
    visit('/fr');
    mockState({ [FLAG]: true }, { display: 'j F Y' });
    displayFormat(timestamp);

    mockState({ [FLAG]: false }, { display: 'j F Y' });

    expect(displayFormat(timestamp)).toBe('12 September 2026');
  });
});
