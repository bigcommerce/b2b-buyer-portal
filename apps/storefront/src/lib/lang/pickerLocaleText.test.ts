import { getPickerLocaleText } from './pickerLocaleText';

describe('getPickerLocaleText', () => {
  it('returns the exact locale labels when available', () => {
    expect(getPickerLocaleText('es-mx')).toBe(getPickerLocaleText('es'));
    expect(getPickerLocaleText('pt-br')).toBeDefined();
  });

  it.each([
    ['fr-ca', 'fr'],
    ['de-ch', 'de'],
    ['nl-be', 'nl'],
    ['sv-fi', 'sv'],
    ['es-us', 'es'],
  ])('falls back to the base language labels for %s', (code, base) => {
    expect(getPickerLocaleText(code)).toBeDefined();
    expect(getPickerLocaleText(code)).toBe(getPickerLocaleText(base));
  });

  it('returns the Chinese labels for zh', () => {
    expect(getPickerLocaleText('zh')).toBeDefined();
  });

  it.each(['en', 'en-gb', 'da'])('returns undefined for %s', (code) => {
    expect(getPickerLocaleText(code)).toBeUndefined();
  });
});
