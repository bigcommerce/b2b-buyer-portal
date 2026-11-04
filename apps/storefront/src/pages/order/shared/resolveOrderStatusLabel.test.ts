import { resolveOrderStatusLabel, toOrderStatusItems } from './resolveOrderStatusLabel';

const enMessages = { 'orders.status.pending': 'Pending' };
const deMessages = { 'orders.status.pending': 'Ausstehend' };

const pending = { origin: 'Pending', translation: '', value: 'PENDING' };
const custom = { origin: 'On hold', translation: '', value: 'UNKNOWN' };

const context = (overrides: Partial<Parameters<typeof resolveOrderStatusLabel>[1]> = {}) => ({
  translations: {},
  localeMessages: enMessages,
  enMessages,
  isDefaultLanguage: true,
  ...overrides,
});

describe('resolveOrderStatusLabel', () => {
  describe('default language', () => {
    it('returns the csv translation for a default status', () => {
      const translations = { 'orders.status.pending': 'Waiting' };

      expect(resolveOrderStatusLabel(pending, context({ translations }))).toBe('Waiting');
    });

    it('returns the csv translation keyed by the original for a custom status', () => {
      const translations = { 'On hold': 'Paused' };

      expect(resolveOrderStatusLabel(custom, context({ translations }))).toBe('Paused');
    });

    it('prefers the original over the locale message', () => {
      const renamed = { ...pending, origin: 'Queued' };

      expect(resolveOrderStatusLabel(renamed, context({ localeMessages: deMessages }))).toBe(
        'Queued',
      );
    });

    it('falls back to the locale message when the original is empty', () => {
      const empty = { ...pending, origin: '' };

      expect(resolveOrderStatusLabel(empty, context({ localeMessages: deMessages }))).toBe(
        'Ausstehend',
      );
    });
  });

  describe('additional language', () => {
    const additional = { isDefaultLanguage: false, localeMessages: deMessages };

    it('returns the translation over the locale message', () => {
      const translation = { ...pending, translation: 'Wartet' };

      expect(resolveOrderStatusLabel(translation, context(additional))).toBe('Wartet');
    });

    it('returns the locale message when there is no translation and the original equals en', () => {
      expect(resolveOrderStatusLabel(pending, context(additional))).toBe('Ausstehend');
    });

    it('returns the original over the locale message when it differs from the en phrase', () => {
      const renamed = { ...pending, origin: 'Queued' };

      expect(resolveOrderStatusLabel(renamed, context(additional))).toBe('Queued');
    });

    it('returns the translation over a renamed original', () => {
      const renamed = { ...pending, origin: 'Queued', translation: 'Wartet' };

      expect(resolveOrderStatusLabel(renamed, context(additional))).toBe('Wartet');
    });

    it('ignores csv translations', () => {
      const translations = { 'orders.status.pending': 'Waiting' };

      expect(resolveOrderStatusLabel(pending, context({ ...additional, translations }))).toBe(
        'Ausstehend',
      );
    });

    it('returns the original for a custom status', () => {
      expect(resolveOrderStatusLabel(custom, context(additional))).toBe('On hold');
    });
  });
});

describe('toOrderStatusItems', () => {
  it('builds legacy filter items with the resolved label', () => {
    expect(toOrderStatusItems([pending], context({ localeMessages: deMessages }))).toEqual([
      { systemLabel: 'Pending', customLabel: 'Pending', statusCode: '1' },
    ]);
  });
});
