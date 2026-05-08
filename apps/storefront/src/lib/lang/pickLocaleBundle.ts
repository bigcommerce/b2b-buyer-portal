type LocaleBundles = Record<string, Record<string, string> | undefined>;

export function pickLocaleBundle(
  activeCode: string,
  bundles: LocaleBundles,
): Record<string, string> {
  const target = activeCode.toLowerCase();
  for (const key of Object.keys(bundles)) {
    if (key.toLowerCase() === target) {
      return bundles[key] ?? {};
    }
  }
  return {};
}
