import {
  AccountSettingExtraFieldValue as ExtraFieldValue,
  CompanyUser,
  CompanyUserExtraFieldsInput,
  CustomerFormFieldDefinition,
  CustomerFormFieldsInput,
  FormFieldValue,
  UpdateCompanyUserInput,
  UpdateCustomerInput,
} from '@/shared/service/bc/graphql/accountSetting';
import { Fields, ParamProps } from '@/types/accountSetting';
import { deCodeField } from '@/utils/registerUtils';
import { validatorRules } from '@/utils/validatorRules';

const emailValidate = validatorRules(['email']);

// The "Contact Information" form-field group. For B2B, custom fields in this group are the
// company user's own name-keyed extra fields; other groups are entityId-keyed form fields.
export const CONTACT_GROUP_ID = 1;

export const initB2BInfo = (
  accountSettings: any,
  contactInformation: Partial<Fields>[],
  accountB2BFormFields: Partial<Fields>[],
  additionalInformation: Partial<Fields>[],
) => {
  const extraFields = accountSettings?.extraFields || [];
  contactInformation.forEach((item: Partial<Fields>) => {
    const contactItem = item;
    if (deCodeField(item?.name || '') === 'first_name') {
      contactItem.default = accountSettings.firstName;
    }
    if (deCodeField(item?.name || '') === 'last_name') {
      contactItem.default = accountSettings.lastName;
    }
    if (deCodeField(item?.name || '') === 'phone') {
      contactItem.default = accountSettings.phoneNumber;
    }
    if (deCodeField(item?.name || '') === 'email') {
      contactItem.default = accountSettings.email;
      contactItem.validate = emailValidate;
    }
  });

  if (extraFields.length > 0) {
    extraFields.forEach((field: CustomFieldItems) => {
      const extraField = field;

      const currentField = contactInformation.find(
        (item) => deCodeField(item?.name || '') === extraField.fieldName,
      );

      if (currentField) {
        currentField.default = extraField.fieldValue;
      }
    });
  }

  accountB2BFormFields.forEach((item: Partial<Fields>) => {
    const formField = item;
    if (item.name === 'role') {
      formField.default = accountSettings.companyRoleName;
      formField.disabled = true;
    } else if (item.name === 'company') {
      formField.default = accountSettings.company;
      formField.disabled = true;
    }
  });

  additionalInformation.forEach((item: Partial<Fields>) => {
    const formFields = (accountSettings?.formFields || []).find(
      (field: Partial<Fields>) => field.name === (item.bcLabel || item.label),
    );
    const infoItem = item;
    if (formFields) infoItem.default = formFields.value;
  });

  return [...contactInformation, ...accountB2BFormFields, ...additionalInformation];
};

export const initBcInfo = (
  accountSettings: any,
  contactInformation: Partial<Fields>[],
  additionalInformation: Partial<Fields>[],
) => {
  contactInformation.forEach((item: Partial<Fields>) => {
    const contactInfoItem = item;
    if (deCodeField(item?.name || '') === 'first_name') {
      contactInfoItem.default = accountSettings.firstName;
    }
    if (deCodeField(item?.name || '') === 'last_name') {
      contactInfoItem.default = accountSettings.lastName;
    }
    if (deCodeField(item?.name || '') === 'phone') {
      contactInfoItem.default = accountSettings.phoneNumber;
    }
    if (deCodeField(item?.name || '') === 'email') {
      contactInfoItem.default = accountSettings.email;
      contactInfoItem.validate = emailValidate;
    }
    if (deCodeField(item?.name || '') === 'company') {
      contactInfoItem.default = accountSettings.company;
    }
  });

  additionalInformation.forEach((item: Partial<Fields>) => {
    const formFields = (accountSettings?.formFields || []).find(
      (field: Partial<Fields>) => field.name === (item.bcLabel || item.label),
    );
    const infoItem = item;
    if (formFields) infoItem.default = formFields.value;
  });

  return [...contactInformation, ...additionalInformation];
};

export const b2bSubmitDataProcessing = (
  data: CustomFieldItems,
  accountSettings: any,
  decryptionFields: Partial<Fields>[],
  extraFields: Partial<Fields>[],
) => {
  const userExtraFields = accountSettings?.extraFields || [];

  const param: Partial<ParamProps> = {};
  param.formFields = [];
  let pristine = true;
  let flag = true;
  let useExtraFieldsFlag = false;

  Object.keys(data).forEach((key: string) => {
    decryptionFields.forEach((item: Partial<Fields>) => {
      if (key === item.name) {
        flag = false;
        if (deCodeField(item.name) === 'first_name') {
          if (accountSettings.firstName !== data[item.name]) pristine = false;
          param.firstName = data[item.name];
        }
        if (deCodeField(item.name) === 'last_name') {
          if (accountSettings.lastName !== data[item.name]) pristine = false;
          param.lastName = data[item.name];
        }
        if (deCodeField(item.name) === 'phone') {
          if (accountSettings.phoneNumber !== data[item.name]) pristine = false;
          param.phoneNumber = data[item.name];
        }
        if (deCodeField(item.name) === 'email') {
          if (accountSettings.email !== data[item.name]) pristine = false;
          param.email = data[item.name];
        }
        if (item.custom) {
          const currentField = userExtraFields.find(
            (field: CustomFieldItems) => field.fieldName === deCodeField(item?.name || ''),
          );
          if (currentField?.fieldValue !== data[item.name]) useExtraFieldsFlag = true;
        }
      }
    });
    if (useExtraFieldsFlag) {
      pristine = false;
    }

    if (flag) {
      extraFields.forEach((field: Partial<Fields>) => {
        if (field.fieldId === key && param?.formFields) {
          const { name } = field;
          param.formFields.push({
            name: field?.bcLabel || '',
            value: data[key],
          });
          flag = false;
          const account = (accountSettings?.formFields || []).find(
            (formField: Partial<Fields>) => formField.name === field.bcLabel,
          );
          if (account && JSON.stringify(account.value) !== JSON.stringify(data[key])) {
            pristine = false;
          }

          if (!accountSettings?.formFields?.length && name && !!data[name]) {
            pristine = false;
          }
        }
      });
    }
    if (flag) {
      if (key === 'password') {
        param.newPassword = data[key];
        if (data[key]) pristine = false;
      } else {
        param[key] = data[key];
      }
    }
    flag = true;
  });

  delete param.company;

  delete param.role;

  if (pristine) {
    return undefined;
  }

  return param;
};

export const bcSubmitDataProcessing = (
  data: CustomFieldItems,
  accountSettings: any,
  decryptionFields: Partial<Fields>[],
  extraFields: Partial<Fields>[],
) => {
  const param: Partial<ParamProps> = {};
  param.formFields = [];
  let pristine = true;
  let flag = true;
  Object.keys(data).forEach((key: string) => {
    decryptionFields.forEach((item: Partial<Fields>) => {
      if (key === item.name) {
        flag = false;
        if (deCodeField(item.name) === 'first_name') {
          if (accountSettings.firstName !== data[item.name]) pristine = false;
          param.firstName = data[item.name];
        }
        if (deCodeField(item.name) === 'last_name') {
          if (accountSettings.lastName !== data[item.name]) pristine = false;
          param.lastName = data[item.name];
        }
        if (deCodeField(item.name) === 'phone') {
          if (accountSettings.phoneNumber !== data[item.name]) pristine = false;
          param.phoneNumber = data[item.name];
        }
        if (deCodeField(item.name) === 'email') {
          if (accountSettings.email !== data[item.name]) pristine = false;
          param.email = data[item.name];
        }
        if (deCodeField(item.name) === 'company') {
          if (accountSettings.company !== data[item.name]) pristine = false;
          param.company = data[item.name];
        }
      }
    });

    if (flag) {
      extraFields.forEach((field: Partial<Fields>) => {
        if (field.fieldId === key && param?.formFields) {
          param.formFields.push({
            name: field?.bcLabel || '',
            value: data[key],
          });
          flag = false;
          const account = (accountSettings?.formFields || []).find(
            (formField: Partial<Fields>) => formField.name === field.bcLabel,
          );
          if (account && JSON.stringify(account.value) !== JSON.stringify(data[key]))
            pristine = false;
        }
      });
    }

    if (flag) {
      if (key === 'password') {
        param.newPassword = data[key];
        if (data[key]) pristine = false;
      } else {
        param[key] = data[key];
      }
    }
    flag = true;
  });

  if (pristine) {
    return undefined;
  }

  return param;
};

// Normalizes a stored or submitted value for change comparison so a typed stored value
// (number 25, string[] ['a']) and its string form value ('25', ['a']) compare equal.
function normalizeForCompare(value: unknown): string {
  if (value === null || value === undefined) return '';
  // An empty array (e.g. an unchecked checkbox) is "empty", equal to unset — otherwise a
  // never-set checkbox rendered as [] reads as a spurious change from undefined.
  if (Array.isArray(value)) return value.length === 0 ? '' : JSON.stringify(value);
  return String(value);
}

// Coerces a submitted value to a finite number, or undefined when empty/non-numeric,
// so a cleared Number field is skipped rather than written as 0 (Number('') === 0).
function toFiniteNumber(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

// BC's date form-field input is a DateTime, so a date is sent as an ISO string. A plain
// calendar date (YYYY-MM-DD, the datepicker's default output) is mapped explicitly to UTC
// midnight to avoid `new Date`'s local-timezone parsing shifting the day. Anything else falls
// back to Date parsing; an unparseable value returns undefined.
function toIsoDateTime(raw: string): string | undefined {
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return `${raw}T00:00:00.000Z`;
  const parsed = new Date(raw);
  return Number.isNaN(parsed.getTime()) ? undefined : parsed.toISOString();
}

// Builds the shared entityId-keyed form-field groups for customer.updateCustomer and
// company.updateCompanyUser. Each submitted field carries its fieldEntityId (parsed from
// the form config's `field_<id>` fieldId). Callers pass only *changed* fields, so an empty
// text/multiline/date value is an intentional clear and is sent through. A field that can't
// be represented — missing fieldEntityId, an unmapped choice label, or a cleared number/
// checkbox (no empty form) — is collected into `unsendable` instead, so the caller can fail
// loudly rather than report a save that silently dropped the user's edit.
export function buildFormFieldsInput(
  submitted: Partial<ParamProps>['formFields'],
  definitions: CustomerFormFieldDefinition[] = [],
): { formFields?: CustomerFormFieldsInput; unsendable: NonNullable<ParamProps['formFields']> } {
  const defByEntityId = new Map(definitions.map((def) => [def.entityId, def]));
  const formFields: CustomerFormFieldsInput = {};
  const unsendable: NonNullable<ParamProps['formFields']> = [];
  const seen = new Set<number>();

  const optionEntityId = (fieldEntityId: number, value: unknown) =>
    defByEntityId.get(fieldEntityId)?.options?.find((option) => option.label === String(value))
      ?.entityId;

  // Number/date/choice fields have no "empty" representation in the entityId-keyed input, so a
  // cleared one (value blank) is skipped rather than sent or flagged — it must not block the
  // rest of the save. Text/multiline clear via '' and checkbox clears via [] (handled below).
  const isBlank = (value: unknown) =>
    value === null ||
    value === undefined ||
    (typeof value === 'string' && value.trim() === '') ||
    (Array.isArray(value) && value.length === 0);

  const emit = (formField: NonNullable<ParamProps['formFields']>[number]) => {
    const { fieldEntityId, fieldType, value } = formField;
    if (fieldEntityId === undefined || seen.has(fieldEntityId)) {
      unsendable.push(formField);
      return;
    }
    switch (fieldType) {
      case 'multiline':
        seen.add(fieldEntityId);
        (formFields.multilineTexts ??= []).push({
          fieldEntityId,
          multilineText: String(value ?? ''),
        });
        break;
      case 'number': {
        if (isBlank(value)) return;
        const num = toFiniteNumber(value);
        if (num === undefined) {
          unsendable.push(formField);
          return;
        }
        seen.add(fieldEntityId);
        (formFields.numbers ??= []).push({ fieldEntityId, number: num });
        break;
      }
      case 'date': {
        if (isBlank(value)) return;
        const iso = toIsoDateTime(String(value).trim());
        if (iso === undefined) {
          unsendable.push(formField);
          return;
        }
        seen.add(fieldEntityId);
        (formFields.dates ??= []).push({ fieldEntityId, date: iso });
        break;
      }
      case 'dropdown':
      case 'radio': {
        if (isBlank(value)) return;
        const fieldValueEntityId = optionEntityId(fieldEntityId, value);
        if (fieldValueEntityId === undefined) {
          unsendable.push(formField);
          return;
        }
        seen.add(fieldEntityId);
        (formFields.multipleChoices ??= []).push({ fieldEntityId, fieldValueEntityId });
        break;
      }
      case 'checkbox': {
        const values = Array.isArray(value) ? value : [];
        // An empty selection is an intentional clear — send an empty id list.
        if (values.length === 0) {
          seen.add(fieldEntityId);
          (formFields.checkboxes ??= []).push({ fieldEntityId, fieldValueEntityIds: [] });
          break;
        }
        const mapped = values.map((choice) => optionEntityId(fieldEntityId, choice));
        const fieldValueEntityIds = mapped.filter((id): id is number => id !== undefined);
        // Unsendable if any selected label failed to resolve — otherwise part of the user's
        // selection would be dropped silently.
        if (fieldValueEntityIds.length !== mapped.length) {
          unsendable.push(formField);
          return;
        }
        seen.add(fieldEntityId);
        (formFields.checkboxes ??= []).push({ fieldEntityId, fieldValueEntityIds });
        break;
      }
      case 'text':
      default:
        seen.add(fieldEntityId);
        (formFields.texts ??= []).push({ fieldEntityId, text: String(value ?? '') });
        break;
    }
  };

  (submitted ?? []).forEach(emit);

  return { formFields: Object.keys(formFields).length > 0 ? formFields : undefined, unsendable };
}

type ExtraFieldEntry = { name: string; value: unknown; fieldType?: string };

// Builds the name-keyed CompanyUserExtraFieldsInput from changed company-user extra fields.
// The extraFields groups (texts/multilineTexts/numbers/multipleChoices) are all scalar, so an
// array value (e.g. a contact-group checkbox) can't be represented — it's reported in
// `unsendable` so the caller can fail loudly instead of silently dropping the edit.
export function buildExtraFieldsInput(submitted: ExtraFieldEntry[] | undefined): {
  extraFields?: CompanyUserExtraFieldsInput;
  unsendable: ExtraFieldEntry[];
} {
  const extraFields: CompanyUserExtraFieldsInput = {};
  const unsendable: ExtraFieldEntry[] = [];
  const seen = new Set<string>();

  (submitted ?? []).forEach((entry) => {
    const { name, value, fieldType } = entry;
    if (!name || seen.has(name)) return;
    if (Array.isArray(value)) {
      unsendable.push(entry);
      return;
    }
    seen.add(name);
    const text = String(value ?? '');
    switch (fieldType) {
      case 'multiline':
        (extraFields.multilineTexts ??= []).push({ name, multilineText: text });
        break;
      case 'number':
        (extraFields.numbers ??= []).push({ name, number: text });
        break;
      case 'dropdown':
      case 'radio':
        (extraFields.multipleChoices ??= []).push({ name, fieldValue: text });
        break;
      case 'text':
      default:
        (extraFields.texts ??= []).push({ name, text });
        break;
    }
  });

  return { extraFields: Object.keys(extraFields).length > 0 ? extraFields : undefined, unsendable };
}

// Contact scalars shared by both mutation inputs (phoneNumber -> phone).
function assignSharedScalars(
  input: Pick<UpdateCustomerInput, 'firstName' | 'lastName' | 'email' | 'phone'>,
  payload: Partial<ParamProps>,
): void {
  if (payload.firstName !== undefined) input.firstName = payload.firstName as string;
  if (payload.lastName !== undefined) input.lastName = payload.lastName as string;
  if (payload.email !== undefined) input.email = payload.email as string;
  if (payload.phoneNumber !== undefined) input.phone = payload.phoneNumber as string;
}

export function buildUpdateCustomerInput(
  payload: Partial<ParamProps>,
  formFields?: CustomerFormFieldsInput,
): UpdateCustomerInput {
  const input: UpdateCustomerInput = {};

  assignSharedScalars(input, payload);
  if (payload.company !== undefined) input.company = payload.company as string;
  if (formFields && Object.keys(formFields).length > 0) input.formFields = formFields;

  return input;
}

export function buildUpdateCompanyUserInput(
  payload: Partial<ParamProps>,
  formFields?: CustomerFormFieldsInput,
  extraFields?: CompanyUserExtraFieldsInput,
): UpdateCompanyUserInput {
  const input: UpdateCompanyUserInput = {};

  assignSharedScalars(input, payload);
  if (payload.currentPassword) input.currentPassword = payload.currentPassword as string;
  if (payload.newPassword) input.newPassword = payload.newPassword as string;
  if (formFields && Object.keys(formFields).length > 0) input.formFields = formFields;
  if (extraFields && Object.keys(extraFields).length > 0) input.extraFields = extraFields;

  return input;
}

// Parses the numeric form-field entityId encoded in a `field_<id>` config fieldId
// (e.g. "field_26" -> 26). Returns undefined when the fieldId isn't in that shape.
export function parseFieldEntityId(fieldId?: string): number | undefined {
  const match = /^field_(\d+)$/.exec(fieldId ?? '');
  return match ? Number(match[1]) : undefined;
}

// The stored date value is a full ISO string (date.utc), while the form submits YYYY-MM-DD;
// compare on the date-only portion so an untouched date isn't seen as changed and re-sent.
const toDateOnly = (value: unknown): string => String(value ?? '').slice(0, 10);

const isValueChanged = (
  originalValue: unknown,
  submittedValue: unknown,
  fieldType?: string,
): boolean => {
  if (fieldType === 'date') return toDateOnly(originalValue) !== toDateOnly(submittedValue);
  return normalizeForCompare(originalValue) !== normalizeForCompare(submittedValue);
};

// Collects the custom form fields for the native SF GQL updates straight from the form
// values and returns only the ones that actually CHANGED from their stored original. The
// form registers each field under `name` (the submit processor's fieldId capture misses
// them), so read data[item.name]; the entityId the mutations need comes from the `field_<id>`
// fieldId, falling back to the form-field definitions (matched by label) when the fieldId
// isn't in that shape.
export function collectChangedFormFields(
  data: CustomFieldItems,
  accountInfoFormFields: Partial<Fields>[],
  originalFormFields: Array<{ name?: string; value?: unknown }>,
  definitions: CustomerFormFieldDefinition[] = [],
): NonNullable<ParamProps['formFields']> {
  const entityIdByLabel = new Map(definitions.map((def) => [def.label, def.entityId]));
  return accountInfoFormFields
    .filter((item) => item.custom)
    .map((item) => {
      // The field's display label is the key that matches the stored formFields name and the
      // definition label. getAccountFormFields leaves bcLabel empty when the config supplies
      // only labelName (kept on `label`), so fall back to label.
      const name = item.bcLabel || item.label || '';
      return {
        name,
        value: data[item.name || ''],
        fieldType: item.fieldType,
        fieldEntityId: parseFieldEntityId(item.fieldId) ?? entityIdByLabel.get(name),
      };
    })
    .filter((formField) => {
      const original = originalFormFields.find((item) => item.name === formField.name);
      return isValueChanged(original?.value, formField.value, formField.fieldType);
    });
}

// Collects the company-user extra fields that changed — the name-keyed custom fields in the
// contact group (groupId 1), matched from the read's extraFields. Unlike form fields these
// need no entityId or definitions (the mutation keys them by name), so they work through the
// proxy. Returns {name, value, fieldType} entries keyed by the decoded field name.
export function collectChangedExtraFields(
  data: CustomFieldItems,
  accountInfoFormFields: Partial<Fields>[],
  originalExtraFields: Array<{ fieldName?: string; fieldValue?: unknown }>,
): Array<{ name: string; value: unknown; fieldType?: string }> {
  return accountInfoFormFields
    .filter((item) => item.custom && item.groupId === CONTACT_GROUP_ID)
    .map((item) => ({
      name: deCodeField(item.name || ''),
      value: data[item.name || ''],
      fieldType: item.fieldType,
    }))
    .filter((extraField) => {
      const original = originalExtraFields.find((item) => item.fieldName === extraField.name);
      return isValueChanged(original?.fieldValue, extraField.value);
    });
}

function extractExtraFieldValue(field: ExtraFieldValue) {
  switch (field.__typename) {
    case 'TextExtraFieldValue':
      return { fieldName: field.name, fieldValue: field.text };
    case 'MultilineTextExtraFieldValue':
      return { fieldName: field.name, fieldValue: field.multilineText };
    case 'MultipleChoiceExtraFieldValue':
      return { fieldName: field.name, fieldValue: field.value };
    case 'NumberExtraFieldValue':
      return { fieldName: field.name, fieldValue: field.number };
    default:
      return undefined;
  }
}
function extractFormFieldValue(field: FormFieldValue) {
  switch (field.__typename) {
    case 'TextFormFieldValue':
      return { name: field.name, value: field.text };
    case 'MultilineTextFormFieldValue':
      return { name: field.name, value: field.multilineText };
    case 'MultipleChoiceFormFieldValue':
      return { name: field.name, value: field.value };
    case 'NumberFormFieldValue':
      return { name: field.name, value: field.number };
    case 'CheckboxesFormFieldValue':
      return { name: field.name, value: field.values };
    case 'DateFormFieldValue':
      return { name: field.name, value: field.date?.utc };
    case 'PasswordFormFieldValue':
      return { name: field.name, value: field.password };
    default:
      return undefined;
  }
}

export function mapUserToAccountInfo(companyUser?: Partial<CompanyUser>) {
  return {
    firstName: companyUser?.firstName,
    lastName: companyUser?.lastName,
    email: companyUser?.email,
    phoneNumber: companyUser?.phoneNumber,
    company: companyUser?.company,
    companyRoleName: companyUser?.companyRoleName,
    extraFields: companyUser?.extraFields?.map(extractExtraFieldValue).filter(Boolean),
    formFields: companyUser?.formFields?.map(extractFormFieldValue).filter(Boolean),
  };
}
