import en from './en.json';

type LocaleMessages = Record<string, string>;

// Filenames use underscores for BCP-47 region tags (fr_FR.json); runtime codes use dashes (fr-FR).
const localeLoaders: Record<string, () => Promise<LocaleMessages>> = {
  fr: () => import('./fr.json').then((m) => m.default),
  es: () => import('./es.json').then((m) => m.default),
};

// Returns true when a static bundle covers the given code — either an exact
// match or via the base-language fallback (mirrors pickLocaleBundle's logic).
function hasLocaleBundle(code: string): boolean {
  if (code in localeLoaders) return true;
  const dashIdx = code.indexOf('-');
  if (dashIdx > 0) {
    const lang = code.slice(0, dashIdx);
    if (lang in localeLoaders) return true;
  }
  return false;
}

export { en, hasLocaleBundle, localeLoaders };
