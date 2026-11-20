import dayjs from 'dayjs';

import { loadPickerLocale } from './loadPickerLocale';

describe('loadPickerLocale', () => {
  it('resolves the MUI labels for a supported language', async () => {
    expect(await loadPickerLocale('de')).toBeDefined();
  });

  it('shares the Spanish labels between es and es-mx', async () => {
    expect(await loadPickerLocale('es-mx')).toBe(await loadPickerLocale('es'));
  });

  it('resolves the Chinese labels for zh', async () => {
    expect(await loadPickerLocale('zh')).toBeDefined();
  });

  it.each(['en', 'da'])('resolves no labels for %s', async (locale) => {
    expect(await loadPickerLocale(locale)).toBeUndefined();
  });

  it('registers a picker-only dayjs locale on demand', async () => {
    await loadPickerLocale('ja');

    expect(dayjs('2024-03-15').locale('ja').format('MMMM')).toBe('3月');
  });

  describe('when a locale file fails to load', () => {
    afterEach(() => {
      vi.doUnmock('dayjs/locale/ja');
      vi.doUnmock('@mui/x-date-pickers/locales/jaJP');
      vi.resetModules();
    });

    it('rejects when the dayjs locale fails to load', async () => {
      vi.resetModules();
      vi.doMock('dayjs/locale/ja', () => {
        throw new Error('dayjs chunk failed');
      });
      const { loadPickerLocale: load } = await import('./loadPickerLocale');

      await expect(load('ja')).rejects.toThrow();
    });

    it('rejects when the MUI labels fail to load', async () => {
      vi.resetModules();
      vi.doMock('@mui/x-date-pickers/locales/jaJP', () => {
        throw new Error('mui chunk failed');
      });
      const { loadPickerLocale: load } = await import('./loadPickerLocale');

      await expect(load('ja')).rejects.toThrow();
    });
  });
});
