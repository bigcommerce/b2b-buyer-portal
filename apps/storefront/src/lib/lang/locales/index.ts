import en from './en.json';

type LocaleMessages = Record<string, string>;

// Filenames use underscores for BCP-47 region tags (fr_FR.json); runtime codes use dashes (fr-FR).
const localeLoaders: Record<string, () => Promise<LocaleMessages>> = {
  fr: () => import('./fr.json').then((m) => m.default),
};

export { en, localeLoaders };
