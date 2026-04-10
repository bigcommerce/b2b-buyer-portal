import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useAppSelector } from '@/store';
import { Locale } from '@/store/slices/global';

import B3DropDown from '../B3DropDown';

const getActiveLocale = (locales: Locale[]) =>
  [...locales]
    .sort((a, b) => b.fullPath.length - a.fullPath.length)
    .find((l) => {
      const { href } = window.location;
      if (!href.startsWith(l.fullPath)) return false;
      const next = href[l.fullPath.length];
      return next === undefined || next === '/' || next === '#' || next === '?';
    });

export default function B3LocaleSwitcher() {
  const isMultiLocaleEnabled = useFeatureFlag('LOCAL-3191.B2B_multi_language');
  const availableLocales = useAppSelector(({ global }) => global.availableLocales);

  if (!isMultiLocaleEnabled || availableLocales.length <= 1) {
    return null;
  }

  const activeLocale =
    getActiveLocale(availableLocales) ??
    availableLocales.find((l) => l.isDefault) ??
    availableLocales[0];

  const list = availableLocales.map(({ code }) => ({ key: code, name: code.toUpperCase() }));

  const handleLocaleChange = (code: string | number) => {
    const nextLocale = availableLocales.find((l) => l.code === String(code));
    if (nextLocale && nextLocale.fullPath !== activeLocale.fullPath) {
      window.location.href = nextLocale.fullPath + window.location.hash;
    }
  };

  return (
    <B3DropDown
      title={activeLocale.code.toUpperCase()}
      list={list}
      value={activeLocale.code}
      handleItemClick={handleLocaleChange}
    />
  );
}
