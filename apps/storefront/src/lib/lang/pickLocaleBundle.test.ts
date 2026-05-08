import { pickLocaleBundle } from './pickLocaleBundle';

// LangProvider merges English first, then the picked bundle on top:
//   { ...locales.en, ...pickLocaleBundle(active, locales), ...customText, ...translations }
// So missing keys in the picked bundle naturally fall through to en. The contract
// of pickLocaleBundle is therefore: return the *exact* match for the active locale
// (case-insensitive) or an empty object — never the bare-language file as a
// fallback for an unmatched regional locale.
const merge = (en: Record<string, string>, picked: Record<string, string>) => ({
  ...en,
  ...picked,
});

describe('pickLocaleBundle — regional locale, regional bundle present', () => {
  const bundles = {
    en: { greeting: 'Hello', farewell: 'Goodbye' },
    es: { greeting: 'Hola (es)', farewell: 'Adiós (es)' },
    'es-MX': { greeting: 'Hola (es-MX)' },
  };

  it('s1: returns the exact regional bundle when the phrase is present', () => {
    const picked = pickLocaleBundle('es-MX', bundles);
    expect(merge(bundles.en, picked).greeting).toBe('Hola (es-MX)');
  });

  it('s2: missing phrase falls through to en, never to es', () => {
    const picked = pickLocaleBundle('es-MX', bundles);
    expect(merge(bundles.en, picked).farewell).toBe('Goodbye');
  });

  it('s3: phrase missing from both regional and bare still resolves to en', () => {
    const onlyEn = {
      en: { onlyEnKey: 'only-en' },
      es: {},
      'es-MX': {},
    };
    const picked = pickLocaleBundle('es-MX', onlyEn);
    expect(merge(onlyEn.en, picked).onlyEnKey).toBe('only-en');
  });
});

describe('pickLocaleBundle — bare-language locale', () => {
  it('s4: returns the bare bundle when active locale is bare', () => {
    const bundles = {
      en: { greeting: 'Hello' },
      es: { greeting: 'Hola (es)' },
    };
    const picked = pickLocaleBundle('es', bundles);
    expect(merge(bundles.en, picked).greeting).toBe('Hola (es)');
  });

  it('s5: missing key in bare bundle falls back to en', () => {
    const bundles = {
      en: { greeting: 'Hello', farewell: 'Goodbye' },
      es: { greeting: 'Hola (es)' },
    };
    const picked = pickLocaleBundle('es', bundles);
    expect(merge(bundles.en, picked).farewell).toBe('Goodbye');
  });
});

describe('pickLocaleBundle — numeric region subtag', () => {
  const bundles = {
    en: { greeting: 'Hello', farewell: 'Goodbye' },
    es: { farewell: 'Adiós (es)' },
    'es-419': { greeting: 'Hola (es-419)' },
  };

  it('s6: matches es-419 without dropping the numeric subtag', () => {
    const picked = pickLocaleBundle('es-419', bundles);
    expect(merge(bundles.en, picked).greeting).toBe('Hola (es-419)');
  });

  it('s7: missing key in es-419 still skips bare es', () => {
    const picked = pickLocaleBundle('es-419', bundles);
    expect(merge(bundles.en, picked).farewell).toBe('Goodbye');
  });
});

describe('pickLocaleBundle — case-insensitive matching', () => {
  const bundles = {
    en: { greeting: 'Hello' },
    'es-MX': { greeting: 'Hola (es-MX)' },
  };

  it('s8: ES-mx resolves to the es-MX bundle', () => {
    const picked = pickLocaleBundle('ES-mx', bundles);
    expect(merge(bundles.en, picked).greeting).toBe('Hola (es-MX)');
  });

  it('lowercased regional code also resolves', () => {
    const picked = pickLocaleBundle('es-mx', bundles);
    expect(merge(bundles.en, picked).greeting).toBe('Hola (es-MX)');
  });
});

describe('pickLocaleBundle — unsupported regional locale', () => {
  it('s9: es-ES with no es-ES bundle resolves to en (never reads es)', () => {
    const bundles = {
      en: { greeting: 'Hello' },
      es: { greeting: 'Hola (es)' },
    };
    const picked = pickLocaleBundle('es-ES', bundles);
    expect(picked).toEqual({});
    expect(merge(bundles.en, picked).greeting).toBe('Hello');
  });
});

describe('pickLocaleBundle — admin-forced default', () => {
  it('s10: admin-forced es-MX with missing phrase still falls back to en, not es', () => {
    const bundles = {
      en: { greeting: 'Hello' },
      es: { greeting: 'Hola (es)' },
      'es-MX': {},
    };
    const picked = pickLocaleBundle('es-MX', bundles);
    expect(merge(bundles.en, picked).greeting).toBe('Hello');
  });
});

describe('pickLocaleBundle — edge cases', () => {
  it('returns {} when no bundle matches and no en bundle is present', () => {
    expect(pickLocaleBundle('zh-CN', {})).toEqual({});
  });

  it('returns {} when the matching key is registered but undefined', () => {
    const bundles: Record<string, Record<string, string> | undefined> = {
      en: { greeting: 'Hello' },
      'es-MX': undefined,
    };
    expect(pickLocaleBundle('es-MX', bundles)).toEqual({});
  });

  it('returns the en bundle when active locale is en', () => {
    const bundles = { en: { greeting: 'Hello' } };
    expect(pickLocaleBundle('en', bundles)).toBe(bundles.en);
  });
});
