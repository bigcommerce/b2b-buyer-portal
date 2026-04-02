import { registerCompany } from '@/pages/Registered/RegisterSteps/steps/CompleteStep/registerCompany';
import type { RegisterFields } from '@/pages/Registered/types';
import type { RegisterCompanyStatus } from '@/shared/service/bc/graphql/company';

export interface BcToB2bCustomerDetails {
  firstName: string;
  lastName: string;
  phone?: string;
}

export function applyBcToB2bFormDataToRegisterFields(
  fields: RegisterFields[],
  data: Record<string, unknown>,
): RegisterFields[] {
  return fields.map((field) => {
    const fromForm = data[field.name];
    if (fromForm === undefined) {
      return { ...field };
    }
    return {
      ...field,
      default: fromForm as RegisterFields['default'],
    };
  });
}

export async function submitBcToB2bRegisterCompany(input: {
  data: Record<string, unknown>;
  customerDetails: BcToB2bCustomerDetails;
  contactList: RegisterFields[] | undefined;
  companyInformation: RegisterFields[];
  addressBasicList: RegisterFields[];
  fileList: unknown;
  genericRegistrationErrorMessage: string;
}): Promise<RegisterCompanyStatus> {
  const {
    data,
    customerDetails,
    contactList,
    companyInformation,
    addressBasicList,
    fileList,
    genericRegistrationErrorMessage,
  } = input;

  return registerCompany(customerDetails, fileList, {
    list: applyBcToB2bFormDataToRegisterFields(contactList ?? [], data),
    companyInformation: applyBcToB2bFormDataToRegisterFields(companyInformation, data),
    addressBasicList: applyBcToB2bFormDataToRegisterFields(addressBasicList, data),
    genericRegistrationErrorMessage,
  });
}
