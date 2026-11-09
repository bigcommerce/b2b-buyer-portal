import { faker } from 'tests/test-utils';

import { decodeExtraFieldFormKey, encodeExtraFieldFormKey } from './extraFieldFormKey';

// react-hook-form reads "." "[" "]" quotes and "|" in a field name as path syntax.
const awkwardFieldNames = [
  '[Company User Extra Field] User ERP ID',
  'Dept. Code',
  "Employee's ID",
  'Team "A" lead',
  'Team|Group',
  'items[0].name',
  'Ünïcode Näme ✓',
  '部署 コード',
  'phone',
  'email',
];

describe('encodeExtraFieldFormKey', () => {
  it.each(awkwardFieldNames)('round-trips %j back to the original field name', (fieldName) => {
    expect(decodeExtraFieldFormKey(encodeExtraFieldFormKey(fieldName))).toBe(fieldName);
  });

  it('round-trips arbitrary field names', () => {
    const fieldName = faker.string.sample({ min: 1, max: 60 });

    expect(decodeExtraFieldFormKey(encodeExtraFieldFormKey(fieldName))).toBe(fieldName);
  });

  it.each([...awkwardFieldNames, faker.string.sample({ min: 1, max: 60 })])(
    'produces a key without path syntax for %j',
    (fieldName) => {
      expect(encodeExtraFieldFormKey(fieldName)).not.toMatch(/[.[\]"'|]/);
    },
  );

  it.each([
    ['[Region] ERP ID', 'Region ERP ID'],
    ["Employee's ID", 'Employees ID'],
    ['Dept', 'Dept. Code'],
  ])('gives %j and %j different keys', (first, second) => {
    expect(encodeExtraFieldFormKey(first)).not.toBe(encodeExtraFieldFormKey(second));
  });

  it.each(['companyRoleId', 'email', 'firstName', 'lastName', 'phone'])(
    'never produces the built-in field key %j',
    (builtInKey) => {
      expect(encodeExtraFieldFormKey(builtInKey)).not.toBe(builtInKey);
    },
  );
});
