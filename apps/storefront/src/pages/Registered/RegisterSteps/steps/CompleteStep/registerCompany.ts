import {
  type ExtraFields,
  registerCompany as submitRegisterCompany,
  type RegisterCompanyAddressInput,
  type RegisterCompanyInput,
  type RegisterCompanyStatus,
} from '@/shared/service/bc/graphql/company';
import { deCodeField, toHump } from '@/utils/registerUtils';

import type { RegisterFields } from '../../../types';

interface RegisterCompanyContext {
  list?: RegisterFields[];
  companyInformation: RegisterFields[];
  addressBasicList: RegisterFields[];
  genericRegistrationErrorMessage: string;
}

interface CustomerDetails {
  firstName: string;
  lastName: string;
  phone?: string;
}

function joinedErrorMessages(errors: Array<{ message: string }>): string {
  return errors.map((e) => e.message).join('; ');
}

function filterNonCustomRegisterFields(registerFields: RegisterFields[]): RegisterFields[] {
  return registerFields.filter((field) => !field.custom);
}

function filterCustomRegisterFields(registerFields: RegisterFields[]): RegisterFields[] {
  return registerFields.filter((field) => !!field.custom);
}

/** Company “standard” rows: not custom, and not file upload fields. */
function filterCompanyStandardRegisterFields(
  companyInformation: RegisterFields[],
): RegisterFields[] {
  return filterNonCustomRegisterFields(companyInformation).filter(
    (field) => field.fieldType !== 'files',
  );
}

/**
 * Storefront GraphQL expects `extraFields.numbers[].number` as Int/Float; form state often stores strings.
 */
function coerceExtraFieldNumber(value: unknown): number | undefined {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const trimmed = value.trim();
    if (trimmed === '') return undefined;
    const parsed = Number(trimmed);
    if (Number.isFinite(parsed)) return parsed;
  }
  return undefined;
}

/**
 * Maps form extra fields to GraphQL `ExtraFields` using each field's stored value (`default` on `RegisterFields`).
 * Omits empty / whitespace-only values so the mutation payload does not send pointless or invalid entries.
 */
function buildGraphQLExtraFields(registerFields: RegisterFields[]): ExtraFields | undefined {
  const textEntries: NonNullable<ExtraFields['texts']> = [];
  const numberEntries: NonNullable<ExtraFields['numbers']> = [];
  const multilineTextEntries: NonNullable<ExtraFields['multilineTexts']> = [];
  const multipleChoiceEntries: NonNullable<ExtraFields['multipleChoices']> = [];

  registerFields.forEach((field) => {
    const decodedFieldName = deCodeField(field.name);
    const storedValue = field.default;
    if (storedValue === undefined || storedValue === null || Array.isArray(storedValue)) {
      return;
    }

    if (field.fieldType === 'number') {
      const numericValue = coerceExtraFieldNumber(storedValue);
      if (numericValue !== undefined) {
        numberEntries.push({ name: decodedFieldName, number: numericValue });
      }
      return;
    }

    const trimmedString = String(storedValue).trim();
    if (trimmedString === '') return;

    switch (field.fieldType) {
      case 'multiline':
        multilineTextEntries.push({
          name: decodedFieldName,
          multilineText: trimmedString,
        });
        break;
      case 'dropdown':
        multipleChoiceEntries.push({
          name: decodedFieldName,
          fieldValue: trimmedString,
        });
        break;
      default:
        textEntries.push({ name: decodedFieldName, text: trimmedString });
    }
  });

  const extraFieldsPayload: ExtraFields = {};
  if (textEntries.length) extraFieldsPayload.texts = textEntries;
  if (numberEntries.length) extraFieldsPayload.numbers = numberEntries;
  if (multilineTextEntries.length) extraFieldsPayload.multilineTexts = multilineTextEntries;
  if (multipleChoiceEntries.length) extraFieldsPayload.multipleChoices = multipleChoiceEntries;
  return Object.keys(extraFieldsPayload).length ? extraFieldsPayload : undefined;
}

function buildAddressFieldsFromForm(
  addressBasicList: RegisterFields[],
  customerDetails: CustomerDetails,
): RegisterCompanyAddressInput {
  const fieldsByDecodedName: Record<string, RegisterFields> = {};
  filterNonCustomRegisterFields(addressBasicList).forEach((field) => {
    fieldsByDecodedName[deCodeField(field.name)] = field;
  });

  const getDefaultString = (decodedFieldName: string) =>
    String(fieldsByDecodedName[decodedFieldName]?.default ?? '');

  const phone = String(customerDetails.phone ?? '').trim();

  return {
    firstName: customerDetails.firstName,
    lastName: customerDetails.lastName,
    phone: phone || undefined,
    address1: getDefaultString('address1'),
    city: getDefaultString('city'),
    countryCode: getDefaultString('country'),
    address2: getDefaultString('address2') || undefined,
    stateOrProvince: getDefaultString('state') || undefined,
    postalCode: getDefaultString('zip_code') || undefined,
    extraFields: buildGraphQLExtraFields(filterCustomRegisterFields(addressBasicList)),
  };
}

function buildCompanyStandardFields(companyInformation: RegisterFields[]): Record<string, string> {
  const fieldValuesByCamelName: Record<string, string> = {};
  filterCompanyStandardRegisterFields(companyInformation).forEach((field) => {
    fieldValuesByCamelName[toHump(deCodeField(field.name))] = String(field?.default ?? '');
  });
  return fieldValuesByCamelName;
}

function buildCompanyUserFields(
  contactInformationFields: RegisterFields[],
): RegisterCompanyInput['companyUser'] {
  const extraFields = buildGraphQLExtraFields(filterCustomRegisterFields(contactInformationFields));
  return extraFields ? { extraFields } : undefined;
}

function mapUploadedFilesToRegisterInput(
  fileList: unknown,
): RegisterCompanyInput['fileList'] | undefined {
  if (!fileList || !Array.isArray(fileList) || fileList.length === 0) return undefined;

  const fileReferences = (fileList as Array<Record<string, unknown>>)
    .map((uploadedFile) => {
      const fileIdentifier = uploadedFile.fileId ?? uploadedFile.id;
      if (fileIdentifier === undefined || fileIdentifier === null || fileIdentifier === '') {
        return null;
      }
      return { fileId: `${fileIdentifier}` };
    })
    .filter((fileReference): fileReference is { fileId: string } => fileReference !== null);

  return fileReferences.length ? fileReferences : undefined;
}

function buildRegisterCompanyInput(
  customerDetails: CustomerDetails,
  fileList: unknown,
  context: RegisterCompanyContext,
): RegisterCompanyInput {
  const { list: contactInformationFields, companyInformation, addressBasicList } = context;
  const companyStandardFieldValues = buildCompanyStandardFields(companyInformation);

  return {
    name: companyStandardFieldValues.companyName ?? '',
    email: companyStandardFieldValues.companyEmail ?? '',
    phone: companyStandardFieldValues.companyPhoneNumber ?? '',
    address: buildAddressFieldsFromForm(addressBasicList, customerDetails),
    fileList: mapUploadedFilesToRegisterInput(fileList),
    extraFields: buildGraphQLExtraFields(filterCustomRegisterFields(companyInformation)),
    companyUser: buildCompanyUserFields(contactInformationFields ?? []),
  };
}

/** Registers a B2B company via the Storefront GraphQL `registerCompany` mutation. */
export async function registerCompany(
  customerDetails: CustomerDetails,
  fileList: unknown,
  context: RegisterCompanyContext,
): Promise<RegisterCompanyStatus> {
  const res = await submitRegisterCompany(
    buildRegisterCompanyInput(customerDetails, fileList, context),
  );
  if (res.errors?.length) {
    throw new Error(joinedErrorMessages(res.errors));
  }
  const result = res.data?.company?.registerCompany;
  if (!result) {
    throw new Error(context.genericRegistrationErrorMessage);
  }
  if (result.errors?.length) {
    throw new Error(joinedErrorMessages(result.errors));
  }
  return result.status;
}
