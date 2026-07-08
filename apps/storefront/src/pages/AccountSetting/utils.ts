import {
  AccountSettingExtraFieldValue as ExtraFieldValue,
  CompanyUser,
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
      (field: Partial<Fields>) => field.name === item.bcLabel,
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
      (field: Partial<Fields>) => field.name === item.bcLabel,
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
            fieldType: field.fieldType,
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

// Choice field types whose selected option must be resolved to an entityId via the
// form-field definitions (the mutations take an id, not a label). Kept as one exported
// list so the "which fields need definitions" gate and the emit routing can't drift apart.
const CHOICE_FIELD_TYPES = ['dropdown', 'radio', 'checkbox'];
export const fieldTypeNeedsOptions = (fieldType?: string): boolean =>
  CHOICE_FIELD_TYPES.includes(fieldType ?? '');

// Normalizes a stored or submitted value for change comparison so a typed stored value
// (number 25, string[] ['a']) and its string form value ('25', ['a']) compare equal.
function normalizeForCompare(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (Array.isArray(value)) return JSON.stringify(value);
  return String(value);
}

// Coerces a submitted value to a finite number, or undefined when empty/non-numeric,
// so a cleared Number field is skipped rather than written as 0 (Number('') === 0).
function toFiniteNumber(value: unknown): number | undefined {
  if (value === '' || value === null || value === undefined) return undefined;
  const num = Number(value);
  return Number.isFinite(num) ? num : undefined;
}

// Builds the shared entityId-keyed form-field groups for customer.updateCustomer and
// company.updateCompanyUser. Each submitted field carries its fieldEntityId (parsed from
// the form config's `field_<id>` fieldId). Callers pass only *changed* fields, so an empty
// text/multiline/date value is an intentional clear and is sent through. A field that can't
// be represented — missing fieldEntityId, an unmapped choice label, or a cleared number/
// checkbox (no empty form) — is collected into `unsendable` instead, so the caller can fail
// loudly rather than report a save that silently dropped the user's edit.
function buildFormFieldsInput(
  submitted: Partial<ParamProps>['formFields'],
  definitions: CustomerFormFieldDefinition[],
): { formFields?: CustomerFormFieldsInput; unsendable: NonNullable<ParamProps['formFields']> } {
  const defByEntityId = new Map(definitions.map((def) => [def.entityId, def]));
  const formFields: CustomerFormFieldsInput = {};
  const unsendable: NonNullable<ParamProps['formFields']> = [];
  const seen = new Set<number>();

  const optionEntityId = (fieldEntityId: number, value: unknown) =>
    defByEntityId.get(fieldEntityId)?.options?.find((option) => option.label === String(value))
      ?.entityId;

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
        const num = toFiniteNumber(value);
        if (num === undefined) {
          unsendable.push(formField);
          return;
        }
        seen.add(fieldEntityId);
        (formFields.numbers ??= []).push({ fieldEntityId, number: num });
        break;
      }
      case 'date':
        seen.add(fieldEntityId);
        (formFields.dates ??= []).push({ fieldEntityId, date: String(value ?? '') });
        break;
      case 'dropdown':
      case 'radio': {
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
        const values = Array.isArray(value) ? value : [value];
        const fieldValueEntityIds = values
          .map((choice) => optionEntityId(fieldEntityId, choice))
          .filter((id): id is number => id !== undefined);
        if (fieldValueEntityIds.length === 0) {
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

// The changed form fields that buildFormFieldsInput can't send (see above). The caller uses
// this to surface an error instead of a misleading "saved" when an edit would be dropped.
export function getUnsendableFormFields(
  submitted: Partial<ParamProps>['formFields'],
  definitions: CustomerFormFieldDefinition[] = [],
): NonNullable<ParamProps['formFields']> {
  return buildFormFieldsInput(submitted, definitions).unsendable;
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

// Builds the BC-native customer.updateCustomer input from the submit payload.
export function buildUpdateCustomerInput(
  payload: Partial<ParamProps>,
  definitions: CustomerFormFieldDefinition[] = [],
): UpdateCustomerInput {
  const input: UpdateCustomerInput = {};

  assignSharedScalars(input, payload);
  if (payload.company !== undefined) input.company = payload.company as string;

  const { formFields } = buildFormFieldsInput(payload.formFields, definitions);
  if (formFields) input.formFields = formFields;

  return input;
}

// Builds the B2B company.updateCompanyUser input. Form fields use the same entityId-keyed
// shape as customer.updateCustomer; the scalars carry current/new password instead of company.
export function buildUpdateCompanyUserInput(
  payload: Partial<ParamProps>,
  definitions: CustomerFormFieldDefinition[] = [],
): UpdateCompanyUserInput {
  const input: UpdateCompanyUserInput = {};

  assignSharedScalars(input, payload);
  if (payload.currentPassword) input.currentPassword = payload.currentPassword as string;
  if (payload.newPassword) input.newPassword = payload.newPassword as string;

  const { formFields } = buildFormFieldsInput(payload.formFields, definitions);
  if (formFields) input.formFields = formFields;

  return input;
}

// Parses the numeric form-field entityId encoded in a `field_<id>` config fieldId
// (e.g. "field_26" -> 26). Returns undefined when the fieldId isn't in that shape.
export function parseFieldEntityId(fieldId?: string): number | undefined {
  const match = /^field_(\d+)$/.exec(fieldId ?? '');
  return match ? Number(match[1]) : undefined;
}

// Collects the custom form fields for the native SF GQL updates straight from the form
// values and returns only the ones that actually CHANGED from their stored original. The
// form registers each field under `name` (the submit processor's fieldId capture misses
// them), so read data[item.name]; the entityId the mutations need is encoded in the
// `field_<id>` fieldId. Values are normalized before comparison so a typed stored value
// (number/array) and its string form value don't read as a spurious change, and an unchanged
// field isn't re-sent on an unrelated edit.
export function collectChangedFormFields(
  data: CustomFieldItems,
  accountInfoFormFields: Partial<Fields>[],
  originalFormFields: Array<{ name?: string; value?: unknown }>,
): NonNullable<ParamProps['formFields']> {
  return accountInfoFormFields
    .filter((item) => item.custom)
    .map((item) => ({
      name: item.bcLabel || '',
      value: data[item.name || ''],
      fieldType: item.fieldType,
      fieldEntityId: parseFieldEntityId(item.fieldId),
    }))
    .filter((formField) => {
      const original = originalFormFields.find((item) => item.name === formField.name);
      return normalizeForCompare(original?.value) !== normalizeForCompare(formField.value);
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
