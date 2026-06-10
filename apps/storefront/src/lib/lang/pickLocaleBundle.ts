type LocaleCode = string;
type LocaleBundles = Record<LocaleCode, Record<string, string> | undefined>;

export function getFallbackLocale(code: string): string | null {
  const dashIdx = code.indexOf('-');
  return dashIdx > 0 ? code.slice(0, dashIdx) : null;
}

export function pickLocaleBundle(
  activeLocaleCode: string,
  bundles: LocaleBundles,
): Record<string, string> {
  const direct = bundles[activeLocaleCode];
  if (direct) {
    return direct;
  }

  const fallback = getFallbackLocale(activeLocaleCode);
  if (fallback) {
    const fallbackBundle = bundles[fallback];
    if (fallbackBundle) {
      return fallbackBundle;
    }
  }

  return {};
}
