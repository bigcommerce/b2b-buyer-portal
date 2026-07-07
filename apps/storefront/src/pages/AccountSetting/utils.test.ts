import { describe, expect, it } from 'vitest';

import type {
  AccountSettingExtraFieldValue,
  CompanyUser,
  CustomerFormFieldDefinition,
  FormFieldValue,
} from '@/shared/service/bc/graphql/accountSetting';
import type { Fields } from '@/types/accountSetting';
import { Base64 } from '@/utils/base64';

import {
  b2bSubmitDataProcessing,
  bcSubmitDataProcessing,
  buildUpdateCompanyUserInput,
  buildUpdateCustomerInput,
  collectChangedFormFields,
  initB2BInfo,
  initBcInfo,
  mapUserToAccountInfo,
  parseFieldEntityId,
} from './utils';

// `deCodeField` Base64-decodes every field name except those in the
// no-encrypt list (country/state/email). The helpers below build encrypted
// field names the same way the real form does.
const firstNameField = Base64.encode('first_name');
const lastNameField = Base64.encode('last_name');
const phoneField = Base64.encode('phone');
const companyField = Base64.encode('company');
const emailField = 'email';

const field = (overrides: Partial<Fields>): Partial<Fields> => ({ ...overrides });

const accountInfo = {
  firstName: 'Ada',
  lastName: 'Lovelace',
  email: 'ada@example.com',
  phoneNumber: '5551234',
  company: 'Analytical Engines',
  companyRoleName: 'Admin',
  extraFields: [{ fieldName: 'taxId', fieldValue: 'TAX-1' }],
  formFields: [{ name: 'Newsletter', value: 'Weekly' }],
};

describe('initB2BInfo', () => {
  it('fills contact information defaults and attaches the email validator', () => {
    const contactInformation = [
      field({ name: firstNameField }),
      field({ name: lastNameField }),
      field({ name: phoneField }),
      field({ name: emailField }),
    ];

    const [firstName, lastName, phone, email] = initB2BInfo(
      accountInfo,
      contactInformation,
      [],
      [],
    );

    expect(firstName.default).toBe('Ada');
    expect(lastName.default).toBe('Lovelace');
    expect(phone.default).toBe('5551234');
    expect(email.default).toBe('ada@example.com');
    expect(typeof email.validate).toBe('function');
  });

  it('overrides contact defaults with matching extra field values', () => {
    const taxIdField = Base64.encode('taxId');
    const contactInformation = [field({ name: taxIdField })];

    const [result] = initB2BInfo(accountInfo, contactInformation, [], []);

    expect(result.default).toBe('TAX-1');
  });

  it('ignores extra fields with no matching contact field', () => {
    const contactInformation = [field({ name: firstNameField })];

    const [result] = initB2BInfo(
      { ...accountInfo, extraFields: [{ fieldName: 'unknown', fieldValue: 'x' }] },
      contactInformation,
      [],
      [],
    );

    expect(result.default).toBe('Ada');
  });

  it('sets and disables the role and company B2B form fields', () => {
    const accountB2BFormFields = [field({ name: 'role' }), field({ name: 'company' })];

    const result = initB2BInfo(accountInfo, [], accountB2BFormFields, []);
    const [role, company] = result;

    expect(role.default).toBe('Admin');
    expect(role.disabled).toBe(true);
    expect(company.default).toBe('Analytical Engines');
    expect(company.disabled).toBe(true);
  });

  it('maps additional information defaults from matching form fields', () => {
    const additionalInformation = [field({ bcLabel: 'Newsletter' }), field({ bcLabel: 'Missing' })];

    const result = initB2BInfo(accountInfo, [], [], additionalInformation);
    const [matched, unmatched] = result;

    expect(matched.default).toBe('Weekly');
    expect(unmatched.default).toBeUndefined();
  });

  it('handles missing extraFields and formFields without throwing', () => {
    const contactInformation = [field({ name: firstNameField })];

    expect(() =>
      initB2BInfo({ firstName: 'Ada' }, contactInformation, [], [field({ bcLabel: 'Newsletter' })]),
    ).not.toThrow();
  });
});

describe('initBcInfo', () => {
  it('fills contact information including company and attaches the email validator', () => {
    const contactInformation = [
      field({ name: firstNameField }),
      field({ name: lastNameField }),
      field({ name: phoneField }),
      field({ name: emailField }),
      field({ name: companyField }),
    ];

    const [firstName, lastName, phone, email, company] = initBcInfo(
      accountInfo,
      contactInformation,
      [],
    );

    expect(firstName.default).toBe('Ada');
    expect(lastName.default).toBe('Lovelace');
    expect(phone.default).toBe('5551234');
    expect(email.default).toBe('ada@example.com');
    expect(typeof email.validate).toBe('function');
    expect(company.default).toBe('Analytical Engines');
  });

  it('maps additional information defaults from matching form fields', () => {
    const additionalInformation = [field({ bcLabel: 'Newsletter' })];

    const [result] = initBcInfo(accountInfo, [], additionalInformation);

    expect(result.default).toBe('Weekly');
  });
});

describe('b2bSubmitDataProcessing', () => {
  const decryptionFields = [
    field({ name: firstNameField }),
    field({ name: lastNameField }),
    field({ name: phoneField }),
    field({ name: emailField }),
  ];

  it('returns undefined when nothing changed (pristine)', () => {
    const data = {
      [firstNameField]: 'Ada',
      [lastNameField]: 'Lovelace',
      [phoneField]: '5551234',
      [emailField]: 'ada@example.com',
    };

    expect(b2bSubmitDataProcessing(data, accountInfo, decryptionFields, [])).toBeUndefined();
  });

  it('collects changed contact fields and drops company/role from the payload', () => {
    const data = {
      [firstNameField]: 'Grace',
      [lastNameField]: 'Lovelace',
      company: 'Other Co',
      role: 'Buyer',
    };

    const result = b2bSubmitDataProcessing(data, accountInfo, decryptionFields, []);

    expect(result).toMatchObject({ firstName: 'Grace', lastName: 'Lovelace' });
    expect(result).not.toHaveProperty('company');
    expect(result).not.toHaveProperty('role');
  });

  it('marks the form dirty when a custom decryption field value changes', () => {
    const taxIdField = Base64.encode('taxId');
    const customDecryptionFields = [field({ name: taxIdField, custom: true })];
    const data = { [taxIdField]: 'TAX-CHANGED' };

    const result = b2bSubmitDataProcessing(data, accountInfo, customDecryptionFields, []);

    expect(result).toBeDefined();
  });

  it('pushes form-field changes using the bcLabel and detects a changed value', () => {
    const extraFields = [field({ fieldId: 'ff_news', bcLabel: 'Newsletter' })];
    const data = { ff_news: 'Daily' };

    const result = b2bSubmitDataProcessing(data, accountInfo, [], extraFields);

    expect(result?.formFields).toEqual([{ name: 'Newsletter', value: 'Daily' }]);
  });

  it('maps password to newPassword and marks the form dirty', () => {
    const data = { password: 'NewPass1!' };

    const result = b2bSubmitDataProcessing(data, accountInfo, [], []);

    expect(result?.newPassword).toBe('NewPass1!');
  });

  it('keeps unknown keys on the payload once another change makes it dirty', () => {
    const data = { custom_attribute: 'value', [firstNameField]: 'Grace' };

    const result = b2bSubmitDataProcessing(data, accountInfo, decryptionFields, []);

    expect(result).toMatchObject({ custom_attribute: 'value', firstName: 'Grace' });
  });

  it('stays pristine (returns undefined) when only an unknown key changes', () => {
    const data = { custom_attribute: 'value', password: '' };

    expect(b2bSubmitDataProcessing(data, accountInfo, [], [])).toBeUndefined();
  });
});

describe('bcSubmitDataProcessing', () => {
  const decryptionFields = [
    field({ name: firstNameField }),
    field({ name: lastNameField }),
    field({ name: phoneField }),
    field({ name: emailField }),
    field({ name: companyField }),
  ];

  it('returns undefined when nothing changed (pristine)', () => {
    const data = {
      [firstNameField]: 'Ada',
      [lastNameField]: 'Lovelace',
      [phoneField]: '5551234',
      [emailField]: 'ada@example.com',
      [companyField]: 'Analytical Engines',
    };

    expect(bcSubmitDataProcessing(data, accountInfo, decryptionFields, [])).toBeUndefined();
  });

  it('collects changed contact fields including company (kept for BC)', () => {
    const data = {
      [firstNameField]: 'Grace',
      [companyField]: 'New Co',
    };

    const result = bcSubmitDataProcessing(data, accountInfo, decryptionFields, []);

    expect(result).toMatchObject({ firstName: 'Grace', company: 'New Co' });
  });

  it('pushes form-field changes and maps password to newPassword', () => {
    const extraFields = [field({ fieldId: 'ff_news', bcLabel: 'Newsletter' })];
    const data = { ff_news: 'Daily', password: 'NewPass1!' };

    const result = bcSubmitDataProcessing(data, accountInfo, [], extraFields);

    expect(result?.formFields).toEqual([{ name: 'Newsletter', value: 'Daily' }]);
    expect(result?.newPassword).toBe('NewPass1!');
  });
});

describe('mapUserToAccountInfo', () => {
  it('returns an object of undefined fields when given no user', () => {
    expect(mapUserToAccountInfo(undefined)).toEqual({
      firstName: undefined,
      lastName: undefined,
      email: undefined,
      phoneNumber: undefined,
      company: undefined,
      companyRoleName: undefined,
      extraFields: undefined,
      formFields: undefined,
    });
  });

  it('maps scalar fields and normalizes every extra-field and form-field union variant', () => {
    const extraFields: AccountSettingExtraFieldValue[] = [
      { __typename: 'TextExtraFieldValue', fieldEntityId: 1, name: 'eText', text: 'a' },
      {
        __typename: 'MultilineTextExtraFieldValue',
        fieldEntityId: 2,
        name: 'eMulti',
        multilineText: 'b',
      },
      {
        __typename: 'MultipleChoiceExtraFieldValue',
        fieldEntityId: 3,
        name: 'eChoice',
        value: 'c',
      },
      { __typename: 'NumberExtraFieldValue', fieldEntityId: 4, name: 'eNumber', number: 5 },
    ];

    const formFields: FormFieldValue[] = [
      { __typename: 'TextFormFieldValue', entityId: 1, name: 'fText', text: 'a' },
      {
        __typename: 'MultilineTextFormFieldValue',
        entityId: 2,
        name: 'fMulti',
        multilineText: 'b',
      },
      {
        __typename: 'MultipleChoiceFormFieldValue',
        entityId: 3,
        name: 'fChoice',
        value: 'c',
        valueEntityId: 9,
      },
      { __typename: 'NumberFormFieldValue', entityId: 4, name: 'fNumber', number: 5 },
      {
        __typename: 'CheckboxesFormFieldValue',
        entityId: 5,
        name: 'fChecks',
        valueEntityIds: [1, 2],
        values: ['x', 'y'],
      },
      {
        __typename: 'DateFormFieldValue',
        entityId: 6,
        name: 'fDate',
        date: { utc: '2026-06-10' },
      },
      { __typename: 'PasswordFormFieldValue', entityId: 7, name: 'fPass', password: 'secret' },
    ];

    const user: CompanyUser = {
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phoneNumber: '5551234',
      company: 'Analytical Engines',
      companyRoleName: 'Admin',
      extraFields,
      formFields,
    };

    expect(mapUserToAccountInfo(user)).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phoneNumber: '5551234',
      company: 'Analytical Engines',
      companyRoleName: 'Admin',
      extraFields: [
        { fieldName: 'eText', fieldValue: 'a' },
        { fieldName: 'eMulti', fieldValue: 'b' },
        { fieldName: 'eChoice', fieldValue: 'c' },
        { fieldName: 'eNumber', fieldValue: 5 },
      ],
      formFields: [
        { name: 'fText', value: 'a' },
        { name: 'fMulti', value: 'b' },
        { name: 'fChoice', value: 'c' },
        { name: 'fNumber', value: 5 },
        { name: 'fChecks', value: ['x', 'y'] },
        { name: 'fDate', value: '2026-06-10' },
        { name: 'fPass', value: 'secret' },
      ],
    });
  });

  it('filters out unrecognized extra-field and form-field union members', () => {
    const user = {
      firstName: 'Ada',
      // Simulate the API returning a __typename the client does not yet handle.
      extraFields: [
        { __typename: 'UnknownExtraFieldValue', name: 'mystery', whatever: 1 },
        { __typename: 'TextExtraFieldValue', fieldEntityId: 1, name: 'eText', text: 'a' },
      ],
      formFields: [
        { __typename: 'UnknownFormFieldValue', name: 'mystery', whatever: 1 },
        { __typename: 'TextFormFieldValue', entityId: 1, name: 'fText', text: 'a' },
      ],
    } as unknown as CompanyUser;

    const result = mapUserToAccountInfo(user);

    // The unknown members are dropped, so downstream `.fieldName`/`.name`
    // reads never hit an undefined entry.
    expect(result.extraFields).toEqual([{ fieldName: 'eText', fieldValue: 'a' }]);
    expect(result.formFields).toEqual([{ name: 'fText', value: 'a' }]);
    expect(result.extraFields).not.toContain(undefined);
    expect(result.formFields).not.toContain(undefined);
  });
});

describe('buildUpdateCustomerInput', () => {
  // Choice fields need their options (entityId per label) from the definitions; scalar
  // fields only need the fieldEntityId carried on each submitted entry.
  const definitions: CustomerFormFieldDefinition[] = [
    {
      __typename: 'MultipleChoicesFormField',
      entityId: 14,
      label: 'fChoice',
      options: [
        { entityId: 99, label: 'A' },
        { entityId: 100, label: 'B' },
      ],
    },
    {
      __typename: 'CheckboxesFormField',
      entityId: 15,
      label: 'fChecks',
      options: [
        { entityId: 7, label: 'x' },
        { entityId: 8, label: 'y' },
      ],
    },
  ];

  it('maps scalar fields, mapping phoneNumber to phone', () => {
    const input = buildUpdateCustomerInput({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      company: 'AE',
      phoneNumber: '5551234',
    });

    expect(input).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      company: 'AE',
      phone: '5551234',
    });
  });

  it('routes each form field into its typed group using the fieldEntityId carried on the entry', () => {
    const input = buildUpdateCustomerInput(
      {
        formFields: [
          { name: 'fText', value: 'new', fieldType: 'text', fieldEntityId: 10 },
          { name: 'fMulti', value: 'multi', fieldType: 'multiline', fieldEntityId: 11 },
          { name: 'Age', value: '25', fieldType: 'number', fieldEntityId: 12 },
          { name: 'fDate', value: '2026-06-10', fieldType: 'date', fieldEntityId: 13 },
          { name: 'fChoice', value: 'B', fieldType: 'dropdown', fieldEntityId: 14 },
          { name: 'fChecks', value: ['x', 'y'], fieldType: 'checkbox', fieldEntityId: 15 },
        ],
      },
      definitions,
    );

    expect(input.formFields).toEqual({
      texts: [{ fieldEntityId: 10, text: 'new' }],
      multilineTexts: [{ fieldEntityId: 11, multilineText: 'multi' }],
      numbers: [{ fieldEntityId: 12, number: 25 }],
      dates: [{ fieldEntityId: 13, date: '2026-06-10' }],
      multipleChoices: [{ fieldEntityId: 14, fieldValueEntityId: 100 }],
      checkboxes: [{ fieldEntityId: 15, fieldValueEntityIds: [7, 8] }],
    });
  });

  it('emits scalar fields with no definitions at all (entityId comes from the entry)', () => {
    const input = buildUpdateCustomerInput({
      formFields: [{ name: 'Age', value: '25', fieldType: 'number', fieldEntityId: 26 }],
    });

    expect(input.formFields).toEqual({ numbers: [{ fieldEntityId: 26, number: 25 }] });
  });

  it('maps a changed choice selection to the picked option entityId', () => {
    const input = buildUpdateCustomerInput(
      { formFields: [{ name: 'fChoice', value: 'A', fieldType: 'dropdown', fieldEntityId: 14 }] },
      definitions,
    );

    expect(input.formFields?.multipleChoices).toEqual([
      { fieldEntityId: 14, fieldValueEntityId: 99 },
    ]);
  });

  it('skips a choice whose selected label matches no option', () => {
    const input = buildUpdateCustomerInput(
      {
        formFields: [
          { name: 'fChoice', value: 'not an option', fieldType: 'dropdown', fieldEntityId: 14 },
        ],
      },
      definitions,
    );

    expect(input.formFields).toBeUndefined();
  });

  it('skips a form field whose fieldEntityId could not be resolved', () => {
    const input = buildUpdateCustomerInput({
      firstName: 'Ada',
      formFields: [{ name: 'unknown', value: 'x', fieldType: 'text', fieldEntityId: undefined }],
    });

    expect(input).toEqual({ firstName: 'Ada' });
  });

  it('sends an emptied text field (to clear it) but skips emptied number/checkbox fields', () => {
    // Callers pass only changed fields, so an empty text value is an intentional clear.
    const input = buildUpdateCustomerInput({
      formFields: [
        { name: 'fText', value: '', fieldType: 'text', fieldEntityId: 10 },
        { name: 'Age', value: '', fieldType: 'number', fieldEntityId: 12 },
        { name: 'fChecks', value: [], fieldType: 'checkbox', fieldEntityId: 15 },
      ],
    });

    expect(input.formFields).toEqual({ texts: [{ fieldEntityId: 10, text: '' }] });
  });
});

describe('buildUpdateCompanyUserInput', () => {
  it('maps scalar fields including current/new password (no company field)', () => {
    const input = buildUpdateCompanyUserInput({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phoneNumber: '5551234',
      currentPassword: 'old-pass',
      newPassword: 'new-pass',
    });

    expect(input).toEqual({
      firstName: 'Ada',
      lastName: 'Lovelace',
      email: 'ada@example.com',
      phone: '5551234',
      currentPassword: 'old-pass',
      newPassword: 'new-pass',
    });
  });

  it('routes form fields into the entityId-keyed groups using the fieldEntityId on each entry', () => {
    const input = buildUpdateCompanyUserInput(
      {
        formFields: [
          { name: 'Age', value: '28', fieldType: 'number', fieldEntityId: 26 },
          { name: 'Middle name', value: 'Lee', fieldType: 'text', fieldEntityId: 27 },
          { name: 'fChoice', value: 'B', fieldType: 'dropdown', fieldEntityId: 14 },
        ],
      },
      [
        {
          __typename: 'MultipleChoicesFormField',
          entityId: 14,
          label: 'fChoice',
          options: [
            { entityId: 99, label: 'A' },
            { entityId: 100, label: 'B' },
          ],
        },
      ],
    );

    expect(input.formFields).toEqual({
      numbers: [{ fieldEntityId: 26, number: 28 }],
      texts: [{ fieldEntityId: 27, text: 'Lee' }],
      multipleChoices: [{ fieldEntityId: 14, fieldValueEntityId: 100 }],
    });
  });

  it('omits empty scalars and drops empty form fields', () => {
    const input = buildUpdateCompanyUserInput({
      firstName: 'Ada',
      currentPassword: '',
      newPassword: '',
      formFields: [{ name: 'Age', value: '', fieldType: 'number', fieldEntityId: 26 }],
    });

    expect(input).toEqual({ firstName: 'Ada' });
  });
});

describe('parseFieldEntityId', () => {
  it('extracts the numeric entityId from a field_<id> fieldId', () => {
    expect(parseFieldEntityId('field_26')).toBe(26);
  });

  it('returns undefined for non-matching or missing fieldIds', () => {
    expect(parseFieldEntityId('field_email')).toBeUndefined();
    expect(parseFieldEntityId('26')).toBeUndefined();
    expect(parseFieldEntityId(undefined)).toBeUndefined();
  });
});

describe('collectChangedFormFields', () => {
  const fields = [
    field({
      name: 'field_26',
      bcLabel: 'Age',
      fieldType: 'number',
      fieldId: 'field_26',
      custom: true,
    }),
    field({
      name: 'field_27',
      bcLabel: 'Middle name',
      fieldType: 'text',
      fieldId: 'field_27',
      custom: true,
    }),
    // Non-custom contact field is skipped.
    field({ name: firstNameField, bcLabel: 'First Name', fieldId: 'field_first_name' }),
  ];
  const data = { field_26: 25, field_27: 'Lee', [firstNameField]: 'Ada' };

  it('collects only custom fields, keyed by bcLabel with the parsed fieldEntityId', () => {
    expect(collectChangedFormFields(data, fields, [])).toEqual([
      { name: 'Age', value: 25, fieldType: 'number', fieldEntityId: 26 },
      { name: 'Middle name', value: 'Lee', fieldType: 'text', fieldEntityId: 27 },
    ]);
  });

  it('drops fields whose value matches the original, normalizing typed vs string values', () => {
    // Age stored as the JS number 25 equals the string form value; Middle name changed.
    expect(
      collectChangedFormFields(data, fields, [
        { name: 'Age', value: 25 },
        { name: 'Middle name', value: 'Lee' },
      ]),
    ).toEqual([]);
  });

  it('keeps a field whose value differs from the original', () => {
    expect(collectChangedFormFields(data, fields, [{ name: 'Age', value: 24 }])).toEqual([
      { name: 'Age', value: 25, fieldType: 'number', fieldEntityId: 26 },
      { name: 'Middle name', value: 'Lee', fieldType: 'text', fieldEntityId: 27 },
    ]);
  });
});
