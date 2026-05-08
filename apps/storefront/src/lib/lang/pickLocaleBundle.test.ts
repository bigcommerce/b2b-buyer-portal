import { pickLocaleBundle } from './pickLocaleBundle';

// LangProvider merges English first, then the picked bundle on top:
//   { ...locales.en, ...pickLocaleBundle(active, locales), ...customText, ...translations }
// pickLocaleBundle returns the most specific available bundle: the exact
// regional match if present, otherwise the bare-language bundle, otherwise {}.
// Per-key gaps within the picked bundle fall through to en via the merge —
// they do NOT cascade through the regional → bare chain at key level.
const merge = (en: Record<string, string>, picked: Record<string, string>) => ({
  ...en,
  ...picked,
});

describe('pickLocaleBundle — regional bundle present', () => {
  const bundles = {
    en: { greeting: 'Hello', farewell: 'Goodbye' },
    es: { greeting: 'Hola (es)', farewell: 'Adiós (es)' },
    'es-MX': { greeting: 'Hola (es-MX)' },
  };

  it('s1: returns the exact regional bundle when the phrase is present', () => {
    const picked = pickLocaleBundle('es-MX', bundles);
    expect(merge(bundles.en, picked).greeting).toBe('Hola (es-MX)');
  });

  it('s2: missing key in the regional bundle falls through to en, not to the bare-language bundle', () => {
    const picked = pickLocaleBundle('es-MX', bundles);
    expect(merge(bundles.en, picked).farewell).toBe('Goodbye');
  });

  it('s3: phrase missing from both regional and bare resolves to en', () => {
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

  it('s7: missing key in es-419 falls to en (per-key bare-language fallback is not applied when the regional bundle exists)', () => {
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

describe('pickLocaleBundle — regional bundle missing, bare bundle present', () => {
  it('s9: es-ES with no es-ES bundle now falls back to the bare es bundle', () => {
    const bundles = {
      en: { greeting: 'Hello' },
      es: { greeting: 'Hola (es)' },
    };
    const picked = pickLocaleBundle('es-ES', bundles);
    expect(merge(bundles.en, picked).greeting).toBe('Hola (es)');
  });

  it('fr-CA with no fr-CA bundle uses the shipped fr bundle', () => {
    const bundles = {
      en: { greeting: 'Hello' },
      fr: { greeting: 'Bonjour (fr)' },
    };
    const picked = pickLocaleBundle('fr-CA', bundles);
    expect(merge(bundles.en, picked).greeting).toBe('Bonjour (fr)');
  });

  it('fr-FR with no fr-FR bundle uses the shipped fr bundle', () => {
    const bundles = {
      en: { greeting: 'Hello' },
      fr: { greeting: 'Bonjour (fr)' },
    };
    const picked = pickLocaleBundle('fr-FR', bundles);
    expect(merge(bundles.en, picked).greeting).toBe('Bonjour (fr)');
  });
});

describe('pickLocaleBundle — admin-forced regional default', () => {
  it('s10: admin-forced es-MX with empty regional bundle still falls back to en, not bare es', () => {
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
  it('returns {} when the active locale has no bundle and no bare-language bundle exists', () => {
    expect(pickLocaleBundle('zh-CN', { en: {} })).toEqual({});
  });

  it('returns {} when bundles is empty', () => {
    expect(pickLocaleBundle('zh-CN', {})).toEqual({});
  });

  it('skips a key registered with undefined and falls through to the next candidate', () => {
    const bundles: Record<string, Record<string, string> | undefined> = {
      en: { greeting: 'Hello' },
      fr: { greeting: 'Bonjour' },
      'fr-CA': undefined,
    };
    expect(pickLocaleBundle('fr-CA', bundles)).toBe(bundles.fr);
  });

  it('returns the en bundle when active locale is en', () => {
    const bundles = { en: { greeting: 'Hello' } };
    expect(pickLocaleBundle('en', bundles)).toBe(bundles.en);
  });
});
