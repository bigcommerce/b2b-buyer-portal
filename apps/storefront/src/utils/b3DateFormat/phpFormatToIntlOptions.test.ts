import { hasOrdinalDaySuffix, phpFormatToIntlOptions } from './phpFormatToIntlOptions';

describe('phpFormatToIntlOptions', () => {
  it.each([
    { format: 'j M Y', expected: { day: 'numeric', month: 'short', year: 'numeric' } },
    {
      format: 'M j Y @ g:i A',
      expected: {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
      },
    },
    { format: 'd/m/Y', expected: { day: '2-digit', month: '2-digit', year: 'numeric' } },
    {
      format: 'l, F jS Y',
      expected: { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' },
    },
    {
      format: 'Y-m-d H:i:s',
      expected: {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      },
    },
    {
      format: 'D, n/j/y',
      expected: { weekday: 'short', month: 'numeric', day: 'numeric', year: '2-digit' },
    },
    { format: 'G:i', expected: { hour: 'numeric', minute: '2-digit' } },
  ])('maps $format to Intl options', ({ format, expected }) => {
    expect(phpFormatToIntlOptions(format)).toEqual(expected);
  });

  it('treats backslash-escaped characters as literals', () => {
    expect(phpFormatToIntlOptions('j \\o\\f F Y')).toEqual({
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  });

  it.each([
    'N',
    'w',
    'z',
    'W',
    't',
    'L',
    'o',
    'U',
    'e',
    'T',
    'O',
    'P',
    'c',
    'r',
    'I',
    'Z',
    'B',
    'u',
    'v',
  ])('returns undefined for the unsupported token %s', (token) => {
    expect(phpFormatToIntlOptions(`j M Y ${token}`)).toBeUndefined();
  });

  it('returns undefined when the format has no date or time parts', () => {
    expect(phpFormatToIntlOptions('\\a\\t / - , A')).toBeUndefined();
    expect(phpFormatToIntlOptions('')).toBeUndefined();
  });
});

describe('hasOrdinalDaySuffix', () => {
  it.each(['jS F Y', 'F jS, Y', 'dS M'])('detects the day suffix in %s', (format) => {
    expect(hasOrdinalDaySuffix(format)).toBe(true);
  });

  it.each(['j F Y', 'M j Y @ g:i A', 'j \\S F', '\\jS F', 'YS M j'])(
    'reports no day suffix in %s',
    (format) => {
      expect(hasOrdinalDaySuffix(format)).toBe(false);
    },
  );
});
