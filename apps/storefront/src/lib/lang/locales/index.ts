import en from './en.json';

type LocaleMessages = Record<string, string>;

// Filenames use underscores for BCP-47 region tags (fr_FR.json); runtime codes use dashes (fr-FR).
// en is the eagerly-bundled baseline; every other delivered locale loads via dynamic import.
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

export { en, localeLoaders };
