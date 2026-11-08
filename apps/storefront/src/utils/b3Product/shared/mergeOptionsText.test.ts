import { builder, faker } from 'tests/test-utils';

import { mergeLegacyOptionsText, mergeOptionsText } from './mergeOptionsText';

const buildOptionWith = builder(() => ({
  id: faker.number.int({ min: 1, max: 100000 }),
  type: 'radio_buttons',
  display_name: faker.commerce.productAdjective(),
  required: faker.datatype.boolean(),
  config: { default_value: faker.lorem.word(), checkbox_label: faker.lorem.word() },
  option_values: [{ id: faker.number.int({ min: 1, max: 100000 }), label: faker.lorem.word() }],
}));

describe('mergeOptionsText', () => {
  it('takes translated names and value labels but keeps everything else as stored', () => {
    const stored = buildOptionWith({ required: true, config: { default_value: 'stored' } });
    const [valueId] = stored.option_values.map(({ id }) => id);
    const localized = buildOptionWith({
      id: stored.id,
      display_name: 'Translated name',
      required: false,
      config: { default_value: 'other', checkbox_label: 'Translated checkbox' },
      option_values: [{ id: valueId, label: 'Translated label' }],
    });

    const [merged] = mergeOptionsText([stored], [localized]);

    expect(merged).toEqual({
      ...stored,
      display_name: 'Translated name',
      config: { ...stored.config, checkbox_label: 'Translated checkbox' },
      option_values: [{ id: valueId, label: 'Translated label' }],
    });
  });

  it('neither adds options that are new nor drops options that are gone', () => {
    const kept = buildOptionWith({});
    const gone = buildOptionWith({});
    const added = buildOptionWith({});

    const merged = mergeOptionsText([kept, gone], [buildOptionWith({ id: kept.id }), added]);

    expect(merged.map(({ id }) => id)).toEqual([kept.id, gone.id]);
    expect(merged[1]).toEqual(gone);
  });

  it('keeps the stored labels of checkbox values', () => {
    const stored = buildOptionWith({
      type: 'checkbox',
      config: { checkbox_label: 'Gift wrap' },
      option_values: [{ id: 1, label: 'Yes' }],
    });
    const localized = buildOptionWith({
      id: stored.id,
      type: 'checkbox',
      config: { checkbox_label: 'Emballage cadeau' },
      option_values: [{ id: 1, label: 'Oui' }],
    });

    const [merged] = mergeOptionsText([stored], [localized]);

    expect(merged.option_values).toEqual([{ id: 1, label: 'Yes' }]);
    expect(merged.config?.checkbox_label).toBe('Emballage cadeau');
  });
});

describe('mergeLegacyOptionsText', () => {
  it('takes the translated display name for options that exist in both lists', () => {
    const stored = [
      { option_id: 1, display_name: 'Color', is_required: true, sort_order: 0 },
      { option_id: 2, display_name: 'Size', is_required: false, sort_order: 1 },
    ];

    const merged = mergeLegacyOptionsText(stored, [
      { option_id: 1, display_name: 'Couleur', is_required: false, sort_order: 5 },
      { option_id: 3, display_name: 'Other', is_required: false, sort_order: 6 },
    ]);

    expect(merged).toEqual([{ ...stored[0], display_name: 'Couleur' }, stored[1]]);
  });
});
