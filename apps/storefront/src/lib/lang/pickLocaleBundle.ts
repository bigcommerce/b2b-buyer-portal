type LocaleBundles = Record<string, Record<string, string> | undefined>;

export function pickLocaleBundle(
  activeCode: string,
  bundles: LocaleBundles,
): Record<string, string> {
  // Hot path: direct O(1) property access using the active code as-is.
  const direct = bundles[activeCode];
  if (direct) {
    return direct;
  }

  const dashIdx = activeCode.indexOf('-');
  const language = dashIdx > 0 ? activeCode.slice(0, dashIdx) : '';

  // Hot path: direct O(1) property access using the bare-language code.
  if (language) {
    const directLang = bundles[language];
    if (directLang) {
      return directLang;
    }
  }

  // Slow path: case-insensitive scan, only reached when canonical lookups
  // missed (e.g. caller passed "ES-mx" instead of "es-MX").
  const keys = Object.keys(bundles);
  const target = activeCode.toLowerCase();
  const matchedKey = keys.find((k) => k.toLowerCase() === target);
  if (matchedKey) {
    const bundle = bundles[matchedKey];
    if (bundle) {
      return bundle;
    }
  }

  if (language) {
    const langTarget = language.toLowerCase();
    const matchedLangKey = keys.find((k) => k.toLowerCase() === langTarget);
    if (matchedLangKey) {
      const bundle = bundles[matchedLangKey];
      if (bundle) {
        return bundle;
      }
    }
  }

  return {};
}
