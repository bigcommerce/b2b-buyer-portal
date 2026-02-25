type Messages = Record<string, string>;

let cachedMessages: Messages = {};

const localesPromise: Promise<Messages> = import('./en.json').then((m) => {
  cachedMessages = m.default;
  return cachedMessages;
});

export const getCachedMessages = () => cachedMessages;

export default localesPromise;
