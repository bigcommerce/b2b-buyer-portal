type LocaleCode = string;
type LocaleBundles = Record<LocaleCode, Record<string, string> | undefined>;

export function pickLocaleBundle(
  activeLocaleCode: string,
  bundles: LocaleBundles,
): Record<string, string> {
  const direct = bundles[activeLocaleCode];
  if (direct) {
    return direct;
  }

  const dashIdx = activeLocaleCode.indexOf('-');
  const language = dashIdx > 0 ? activeLocaleCode.slice(0, dashIdx) : '';

  if (language && activeLocaleCode !== language) {
    const directLang = bundles[language];
    if (directLang) {
      return directLang;
    }
  }

  return {};
}
