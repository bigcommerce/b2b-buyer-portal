type LocaleBundles = Record<string, Record<string, string> | undefined>;

export function pickLocaleBundle(
  activeCode: string,
  bundles: LocaleBundles,
): Record<string, string> {
  const target = activeCode.toLowerCase();
  const matchedKey = Object.keys(bundles).find((key) => key.toLowerCase() === target);
  return (matchedKey && bundles[matchedKey]) || {};
}
