import { builder, bulk, faker } from 'tests/test-utils';

import type { RegisterFields } from '@/pages/Registered/types';
import {
  type RegisterCompanyFileInput,
  RegisterCompanyStatus,
  type UploadedCompanyFile,
} from '@/shared/service/bc/graphql/company';
import * as companyGraphqlModule from '@/shared/service/bc/graphql/company';

import { registerCompany } from './registerCompany';

const buildUploadedFileWith = builder<UploadedCompanyFile>(() => ({
  fileId: faker.string.uuid(),
  fileName: faker.system.fileName(),
  fileType: faker.system.mimeType(),
  fileUrl: faker.internet.url(),
  fileSize: faker.number.int({ min: 1, max: 10_000 }),
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

function expectRegisterCompanyFileFormat(file: RegisterCompanyFileInput) {
  expect(file).toEqual({
    fileId: expect.any(String),
    fileUrl: expect.any(String),
    fileName: expect.any(String),
    contentType: expect.any(String),
    fileSize: expect.any(Number),
  });
  expect(file).not.toHaveProperty('fileType');
  expect(Number.isFinite(file.fileSize)).toBe(true);
}

function toRegisterCompanyFileList(
  uploadedFiles: UploadedCompanyFile[],
): RegisterCompanyFileInput[] {
  return uploadedFiles.map(({ fileId, fileUrl, fileName, fileType, fileSize }) => ({
    fileId,
    fileUrl,
    fileName,
    contentType: fileType,
    fileSize: Number(fileSize),
  }));
}

describe('registerCompany — fileList', () => {
  beforeEach(() => {
    vi.spyOn(companyGraphqlModule, 'registerCompany').mockResolvedValue(successResponse());
  });

  it('sends fileList in registerCompany mutation format', async () => {
    const uploadedFile = buildUploadedFileWith('WHATEVER_VALUES');

    await registerCompany(customerDetails, [uploadedFile], minimalContext);

    const { fileList } = vi.mocked(companyGraphqlModule.registerCompany).mock.calls[0][0];

    expect(fileList).toHaveLength(1);
    expectRegisterCompanyFileFormat(fileList![0]);
    expect(fileList).toEqual(toRegisterCompanyFileList([uploadedFile]));
  });

  it('maps upload fileType to contentType and coerces string fileSize', async () => {
    const uploadedFile = buildUploadedFileWith({
      fileType: 'application/pdf',
      fileSize: '1024',
    });

    await registerCompany(customerDetails, [uploadedFile], minimalContext);

    const [mappedFile] = vi.mocked(companyGraphqlModule.registerCompany).mock.calls[0][0].fileList!;

    expectRegisterCompanyFileFormat(mappedFile);
    expect(mappedFile).toEqual({
      fileId: uploadedFile.fileId,
      fileUrl: uploadedFile.fileUrl,
      fileName: uploadedFile.fileName,
      contentType: 'application/pdf',
      fileSize: 1024,
    });
  });

  it('sends every uploaded file in registerCompany fileList format', async () => {
    const uploadedFiles = bulk(buildUploadedFileWith, 'WHATEVER_VALUES').times(2);

    await registerCompany(customerDetails, uploadedFiles, minimalContext);

    const { fileList } = vi.mocked(companyGraphqlModule.registerCompany).mock.calls[0][0];

    expect(fileList).toHaveLength(2);
    fileList!.forEach(expectRegisterCompanyFileFormat);
    expect(fileList).toEqual(toRegisterCompanyFileList(uploadedFiles));
  });

  it('omits fileList when no files are provided', async () => {
    await registerCompany(customerDetails, undefined, minimalContext);

    expect(
      vi.mocked(companyGraphqlModule.registerCompany).mock.calls[0][0].fileList,
    ).toBeUndefined();
  });

  it('omits fileList when the upload result is empty', async () => {
    await registerCompany(customerDetails, [], minimalContext);

    expect(
      vi.mocked(companyGraphqlModule.registerCompany).mock.calls[0][0].fileList,
    ).toBeUndefined();
  });

  it('drops entries with a missing fileId and keeps the rest', async () => {
    const goodFile = buildUploadedFileWith('WHATEVER_VALUES');
    const badFile = buildUploadedFileWith({ fileId: '' });

    await registerCompany(customerDetails, [badFile, goodFile], minimalContext);

    const { fileList } = vi.mocked(companyGraphqlModule.registerCompany).mock.calls[0][0];

    expect(fileList).toHaveLength(1);
    expect(fileList![0].fileId).toBe(goodFile.fileId);
  });

  it('sends an empty fileList when all entries have a missing fileId', async () => {
    const badFiles = bulk(buildUploadedFileWith, { fileId: '' }).times(2);

    await registerCompany(customerDetails, badFiles, minimalContext);

    expect(vi.mocked(companyGraphqlModule.registerCompany).mock.calls[0][0].fileList).toEqual([]);
  });
});
