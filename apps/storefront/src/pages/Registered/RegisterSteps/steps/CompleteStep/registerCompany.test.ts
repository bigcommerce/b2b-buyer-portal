import { builder, bulk, faker } from 'tests/test-utils';

import type { RegisterFields } from '@/pages/Registered/types';
import {
  registerCompany as submitRegisterCompany,
  type RegisterCompanyFileInput,
  RegisterCompanyStatus,
} from '@/shared/service/bc/graphql/company';

import { registerCompany } from './registerCompany';

vi.mock('@/shared/service/bc/graphql/company', async (importOriginal) => ({
  ...(await importOriginal()),
  registerCompany: vi.fn(),
}));

const mockSubmit = vi.mocked(submitRegisterCompany);

const buildRegisterCompanyFileWith = builder<RegisterCompanyFileInput>(() => ({
  fileName: faker.system.fileName(),
  fileType: faker.system.mimeType(),
  fileUrl: faker.internet.url(),
  fileSize: faker.number.int({ min: 1, max: 10_000 }).toString(),
}));

const customerDetails = {
  firstName: 'Jane',
  lastName: 'Doe',
  phone: '0400000000',
};

// Field names must be base64-encoded (deCodeField uses window.atob)
const minimalContext = {
  companyInformation: [
    { name: 'Y29tcGFueV9uYW1l', default: 'Acme', fieldType: 'text', custom: false },
    { name: 'Y29tcGFueV9lbWFpbA==', default: 'acme@test.com', fieldType: 'text', custom: false },
    {
      name: 'Y29tcGFueV9waG9uZV9udW1iZXI=',
      default: '0400000000',
      fieldType: 'text',
      custom: false,
    },
  ] as RegisterFields[],
  addressBasicList: [
    { name: 'YWRkcmVzczE=', default: '123 Main St', fieldType: 'text', custom: false },
    { name: 'Y2l0eQ==', default: 'Melbourne', fieldType: 'text', custom: false },
    { name: 'Y291bnRyeQ==', default: 'AU', fieldType: 'text', custom: false },
  ] as RegisterFields[],
  genericRegistrationErrorMessage: 'Registration failed',
};

function successResponse(status = RegisterCompanyStatus.APPROVED) {
  return {
    data: {
      company: {
        registerCompany: { entityId: 1, status, errors: [] },
      },
    },
  };
}

describe('registerCompany — fileList', () => {
  it('forwards fileList metadata to the registerCompany mutation', async () => {
    mockSubmit.mockResolvedValueOnce(successResponse());

    const fileList = [
      buildRegisterCompanyFileWith({
        fileName: 'invoice.pdf',
        fileType: 'application/pdf',
        fileUrl: 'https://s3.example.com/invoice.pdf',
        fileSize: '2048',
      }),
    ];

    await registerCompany(customerDetails, fileList, minimalContext);

    expect(mockSubmit.mock.calls[0][0].fileList).toEqual(fileList);
  });

  it('forwards multiple files unchanged', async () => {
    mockSubmit.mockResolvedValueOnce(successResponse());

    const fileList = bulk(buildRegisterCompanyFileWith, 'WHATEVER_VALUES').times(2);

    await registerCompany(customerDetails, fileList, minimalContext);

    expect(mockSubmit.mock.calls[0][0].fileList).toEqual(fileList);
  });

  it('forwards an empty fileList', async () => {
    mockSubmit.mockResolvedValueOnce(successResponse());

    await registerCompany(customerDetails, [], minimalContext);

    expect(mockSubmit.mock.calls[0][0].fileList).toEqual([]);
  });
});
