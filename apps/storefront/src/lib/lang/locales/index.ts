import { getFallbackLocale } from '../pickLocaleBundle';

import en from './en.json';

type LocaleMessages = Record<string, string>;

// Locale bundle filenames match the runtime BCP-47-style locale codes (e.g. es-MX.json for "es-MX").
const localeLoaders: Record<string, () => Promise<LocaleMessages>> = {
  da: () => import('./da.json').then((m) => m.default),
  de: () => import('./de.json').then((m) => m.default),
  es: () => import('./es.json').then((m) => m.default),
  'es-419': () => import('./es-419.json').then((m) => m.default),
  'es-AR': () => import('./es-AR.json').then((m) => m.default),
  'es-CL': () => import('./es-CL.json').then((m) => m.default),
  'es-CO': () => import('./es-CO.json').then((m) => m.default),
  'es-LA': () => import('./es-LA.json').then((m) => m.default),
  'es-MX': () => import('./es-MX.json').then((m) => m.default),
  'es-PE': () => import('./es-PE.json').then((m) => m.default),
  fr: () => import('./fr.json').then((m) => m.default),
  it: () => import('./it.json').then((m) => m.default),
  ja: () => import('./ja.json').then((m) => m.default),
  nl: () => import('./nl.json').then((m) => m.default),
  no: () => import('./no.json').then((m) => m.default),
  pl: () => import('./pl.json').then((m) => m.default),
  pt: () => import('./pt.json').then((m) => m.default),
  'pt-BR': () => import('./pt-BR.json').then((m) => m.default),
  sv: () => import('./sv.json').then((m) => m.default),
};

// Returns true when a static bundle covers the given code — either an exact
// match or via the base-language fallback (mirrors pickLocaleBundle's logic).
// en is always covered by the statically imported bundle even though it has no localeLoader entry.
function isSupportedLocale(code: string): boolean {
  if (code === 'en' || code in localeLoaders) {
    return true;
  }
  const fallback = getFallbackLocale(code);
  return fallback !== null && (fallback === 'en' || fallback in localeLoaders);
}

export { en, isSupportedLocale, localeLoaders };
