import { useFeatureFlag } from '@/hooks/useFeatureFlag';
import { useAppSelector } from '@/store';
import { getActiveLocale } from '@/utils/locale';

import B3DropDown from '../B3DropDown';

export default function B3LocaleSwitcher() {
  const isMultiLocaleEnabled = useFeatureFlag('LOCAL-3191.B2B_multi_language');
  const locales = useAppSelector(({ global }) => global.locales);

  if (!isMultiLocaleEnabled || locales.length <= 1) {
    return null;
  }

  const activeLocale = getActiveLocale(locales) ?? locales.find((l) => l.isDefault) ?? locales[0];

  const list = locales.map(({ code }) => ({ key: code, name: code.toUpperCase() }));

  const handleLocaleChange = (code: string | number) => {
    const nextLocale = locales.find((l) => l.code === String(code));
    if (nextLocale && nextLocale.fullPath !== activeLocale.fullPath) {
      // Cached translations are locale-specific; drop the persisted `lang` slice
      // so the new locale refetches instead of rehydrating the previous one.
      localStorage.removeItem('persist:lang');
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
