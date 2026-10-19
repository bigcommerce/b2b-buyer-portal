import { builder, faker } from 'tests/test-utils';

import { resolveOrderStatusLabel } from './resolveOrderStatusLabel';

const buildTranslationsWith = builder(() => ({
  'orders.status.shipped': faker.lorem.words(2),
}));

describe('resolveOrderStatusLabel', () => {
  const label = faker.lorem.words(2);

  describe('default locale', () => {
    it('returns the CSV translation when the merchant provided one', () => {
      const translations = buildTranslationsWith('WHATEVER_VALUES');

      expect(
        resolveOrderStatusLabel({ value: 'SHIPPED', label, isDefaultLocale: true, translations }),
      ).toBe(translations['orders.status.shipped']);
    });

    it('returns the backend label when there is no CSV translation', () => {
      expect(
        resolveOrderStatusLabel({
          value: 'SHIPPED',
          label,
          isDefaultLocale: true,
          translations: {},
        }),
      ).toBe(label);
    });

    it('returns the backend label when the CSV entry is an empty string', () => {
      expect(
        resolveOrderStatusLabel({
          value: 'SHIPPED',
          label,
          isDefaultLocale: true,
          translations: { 'orders.status.shipped': '' },
        }),
      ).toBe(label);
    });

    it('returns the backend label for an unknown status value', () => {
      expect(
        resolveOrderStatusLabel({
          value: faker.string.alpha(12),
          label,
          isDefaultLocale: true,
          translations: buildTranslationsWith('WHATEVER_VALUES'),
        }),
      ).toBe(label);
    });

    it('returns the backend label for a null status value', () => {
      expect(
        resolveOrderStatusLabel({
          value: null,
          label,
          isDefaultLocale: true,
          translations: buildTranslationsWith('WHATEVER_VALUES'),
        }),
      ).toBe(label);
    });
  });

  describe.each([['an additional supported locale'], ['an additional unsupported locale']])(
    '%s',
    () => {
      it('ignores the CSV translation and returns the backend label', () => {
        expect(
          resolveOrderStatusLabel({
            value: 'SHIPPED',
            label,
            isDefaultLocale: false,
            translations: buildTranslationsWith('WHATEVER_VALUES'),
          }),
        ).toBe(label);
      });

      it('returns the backend label when there is no CSV translation', () => {
        expect(
          resolveOrderStatusLabel({
            value: 'SHIPPED',
            label,
            isDefaultLocale: false,
            translations: {},
          }),
        ).toBe(label);
      });
    },
  );
});
