import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useAppSelector } from '@/store';
import { Locales } from '@/store/slices/global';

import B3DropDown from '../B3DropDown';

const getActiveLocale = (locales: Locales) =>
  [...locales]
    .sort((a, b) => b.fullPath.length - a.fullPath.length)
    .find((l) => {
      const { href } = window.location;
      if (!href.startsWith(l.fullPath)) {
        return false;
      }
      const next = href[l.fullPath.length];
      return next === undefined || next === '/' || next === '#' || next === '?';
    });

export default function B3LocaleSwitcher() {
  const isMultiLocaleEnabled = useFeatureFlag('LOCAL-3191.B2B_multi_language');
  const locales = useAppSelector(({ global }) => global.locales);

  if (!isMultiLocaleEnabled || locales.length <= 1) {
    return null;
  }

  const activeLocale =
    getActiveLocale(locales) ??
    locales.find((l) => l.isDefault) ??
    locales[0];

  const list = locales.map(({ code }) => ({ key: code, name: code.toUpperCase() }));

  const handleLocaleChange = (code: string | number) => {
    const nextLocale = locales.find((l) => l.code === String(code));
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
