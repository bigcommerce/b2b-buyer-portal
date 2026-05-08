import en from './en.json';

type LocaleMessages = Record<string, string>;

const lazyModules = import.meta.glob<{ default: LocaleMessages }>('./*.json');

// Filenames use underscores for BCP-47 region tags (fr_FR.json); runtime codes use dashes (fr-FR).
const loaders: Record<string, () => Promise<LocaleMessages>> = Object.fromEntries(
  Object.entries(lazyModules)
    .map(([path, load]) => [path.replace('./', '').replace('.json', ''), load] as const)
    .filter(([file]) => file !== 'en')
    .map(([file, load]) => [file.replace(/_/g, '-'), () => load().then((m) => m.default)]),
);

export { en };
export const localeLoaders = loaders;
