type Messages = Record<string, string>;

const modules = import.meta.glob<Messages>('./*.json', {
  eager: true,
  import: 'default',
});

const filenameToCode = (path: string): string =>
  path
    .replace(/^\.\//, '')
    .replace(/\.json$/, '')
    .replace(/_/g, '-');

const locales: Record<string, Messages> = Object.fromEntries(
  Object.entries(modules).map(([path, messages]) => [filenameToCode(path), messages]),
);

export default locales;
