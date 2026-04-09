import { buildGlobalStateWith } from 'tests/storeStateBuilders';
import { buildCompanyStateWith, renderWithProviders, screen, waitFor } from 'tests/test-utils';

import * as b2bService from '@/shared/service/b2b';
import type { RegisterCompanyMutationResponse } from '@/shared/service/bc/graphql/company';
import { RegisterCompanyStatus } from '@/shared/service/bc/graphql/company';
import * as companyGraphqlModule from '@/shared/service/bc/graphql/company';
import { CustomerRole } from '@/types';
import { getCurrentCustomerInfo } from '@/utils/loginInfo';

import { RegisteredProvider } from '../Registered/Context';

import RegisteredBCToB2B from '.';

const mockRegisterCompanyGraphqlApproved: RegisterCompanyMutationResponse = {
  data: {
    company: {
      registerCompany: {
        entityId: 1,
        status: RegisterCompanyStatus.APPROVED,
        errors: [],
      },
    },
  },
};

const mockCountries = {
  countries: [
    {
      countryCode: 'AU',
      countryName: 'Australia',
      id: '13',
      states: [{ stateName: 'Australian Capital Territory', stateCode: 'ACT' }],
    },
    {
      countryCode: 'US',
      countryName: 'United States',
      id: '1',
      states: [{ stateName: 'California', stateCode: 'CA' }],
    },
  ],
};

const formType3Fields = [
  {
    id: '1',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_first_name',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: true,
    visible: true,
    labelName: 'First Name',
    fieldName: 'first_name',
    fieldType: 'text',
    valueConfigs: { label: 'First Name' },
  },
  {
    id: '3',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_last_name',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: true,
    visible: true,
    labelName: 'Last Name',
    fieldName: 'last_name',
    fieldType: 'text',
    valueConfigs: { label: 'Last Name' },
  },
  {
    id: '5',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_email',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: true,
    visible: true,
    labelName: 'Email Address',
    fieldName: 'email',
    fieldType: 'text',
    valueConfigs: { label: 'Email Address' },
  },
  {
    id: '7',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_phone_number',
    groupId: 1,
    groupName: 'Contact Information',
    isRequired: false,
    visible: true,
    labelName: 'Phone Number',
    fieldName: 'phone',
    fieldType: 'text',
    valueConfigs: { label: 'Phone Number' },
  },
  {
    id: '10',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_company_name',
    groupId: 3,
    groupName: 'Business Details',
    isRequired: true,
    visible: true,
    labelName: 'Company Name',
    fieldName: 'company_name',
    fieldType: 'text',
    valueConfigs: { label: 'Company Name' },
  },
  {
    id: '13',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_company_email',
    groupId: 3,
    groupName: 'Business Details',
    isRequired: true,
    visible: true,
    labelName: 'Company Email',
    fieldName: 'company_email',
    fieldType: 'text',
    valueConfigs: { label: 'Company Email' },
  },
  {
    id: '14',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_company_phone_number',
    groupId: 3,
    groupName: 'Business Details',
    isRequired: true,
    visible: true,
    labelName: 'Company Phone Number',
    fieldName: 'company_phone_number',
    fieldType: 'text',
    valueConfigs: { label: 'Company Phone Number' },
  },
  {
    id: '17',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_country',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'Country',
    fieldName: 'country',
    fieldType: 'dropdown',
    valueConfigs: { label: 'Country', default: null },
  },
  {
    id: '18',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_address_1',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'Address 1',
    fieldName: 'address1',
    fieldType: 'text',
    valueConfigs: { label: 'Address 1' },
  },
  {
    id: '20',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_address_2',
    groupId: 4,
    groupName: 'Address',
    isRequired: false,
    visible: true,
    labelName: 'Address 2',
    fieldName: 'address2',
    fieldType: 'text',
    valueConfigs: { label: 'Address 2' },
  },
  {
    id: '21',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_city',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'City',
    fieldName: 'city',
    fieldType: 'text',
    valueConfigs: { label: 'City' },
  },
  {
    id: '22',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_state',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'State',
    fieldName: 'state',
    fieldType: 'dropdown',
    valueConfigs: { label: 'State' },
  },
  {
    id: '23',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_zip_code',
    groupId: 4,
    groupName: 'Address',
    isRequired: true,
    visible: true,
    labelName: 'Zip Code',
    fieldName: 'zip_code',
    fieldType: 'text',
    valueConfigs: { label: 'Zip Code' },
  },
];

const formType3FieldsWithCustomExtras = [
  ...formType3Fields,
  {
    id: '50',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_custom_co_ref',
    groupId: 3,
    groupName: 'Business Details',
    labelName: 'Custom Co Ref',
    fieldName: 'custom_co_ref',
    fieldType: 'text',
    custom: true,
    visible: true,
    isRequired: true,
    valueConfigs: { label: 'Custom Co Ref' },
  },
  {
    id: '51',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_user_custom_note',
    groupId: 1,
    groupName: 'Contact Information',
    labelName: 'User Custom Note',
    fieldName: 'user_custom_note',
    fieldType: 'text',
    custom: true,
    visible: true,
    isRequired: true,
    valueConfigs: { label: 'User Custom Note' },
  },
  {
    id: '52',
    formType: 3,
    fieldFrom: 10,
    fieldId: 'field_suite_number',
    groupId: 4,
    groupName: 'Address',
    labelName: 'Suite Number',
    fieldName: 'suite_number',
    fieldType: 'text',
    custom: true,
    visible: true,
    isRequired: false,
    valueConfigs: { label: 'Suite Number' },
  },
];

const defaultBcToB2bRegistrationData = {
  businessDetails: {
    'Company Name': 'Test Co',
    'Company Email': 'test.co@example.com',
    'Company Phone Number': '1234567890',
  },
  address: {
    Country: 'United States',
    'Address 1': '2 bb street',
    'Address 2': 'suite 100',
    City: 'New York',
    State: 'California',
    'Zip Code': '54321',
  },
};

vi.mock('@/utils/loginInfo');
vi.mock('@/utils/storefrontConfig');
vi.mock('@/utils/b3Login', () => ({
  loginJump: vi.fn(() => true),
}));

type BCToB2BRegistrationData = {
  businessDetails: Record<string, string>;
  address: Record<string, string>;
};

type CustomExtrasFill = {
  userCustomNote: string;
  customCoRef: string;
  suiteNumber: string;
};

async function completeRegistration(
  user: ReturnType<typeof renderWithProviders>['user'],
  { businessDetails, address }: BCToB2BRegistrationData,
  customExtras?: CustomExtrasFill,
) {
  await waitFor(() => {
    expect(screen.getByLabelText('Company Name', { exact: false })).toBeInTheDocument();
  });

  if (customExtras) {
    await user.type(
      screen.getByLabelText('User Custom Note', { exact: false }),
      customExtras.userCustomNote,
    );
  }

  if (businessDetails['Company Name']) {
    await user.type(
      screen.getByLabelText('Company Name', { exact: false }),
      businessDetails['Company Name'],
    );
  }
  if (businessDetails['Company Email']) {
    await user.type(
      screen.getByLabelText('Company Email', { exact: false }),
      businessDetails['Company Email'],
    );
  }
  if (businessDetails['Company Phone Number']) {
    await user.type(
      screen.getByLabelText('Company Phone Number', { exact: false }),
      businessDetails['Company Phone Number'],
    );
  }

  if (customExtras) {
    await user.type(
      screen.getByLabelText('Custom Co Ref', { exact: false }),
      customExtras.customCoRef,
    );
  }

  if (address.Country) {
    await user.click(screen.getByLabelText('Country', { exact: false }));
    await user.click(screen.getByRole('option', { name: address.Country }));
  }
  if (address['Address 1']) {
    await user.type(screen.getByLabelText('Address 1', { exact: false }), address['Address 1']);
  }
  if (address['Address 2']) {
    await user.type(screen.getByLabelText('Address 2', { exact: false }), address['Address 2']);
  }
  if (address.City) {
    await user.type(screen.getByLabelText('City', { exact: false }), address.City);
  }
  if (address.State) {
    await user.click(screen.getByRole('combobox', { name: /State/i }));
    await user.click(screen.getByRole('option', { name: address.State }));
  }
  if (address['Zip Code']) {
    await user.type(screen.getByLabelText('Zip Code', { exact: false }), address['Zip Code']);
  }

  if (customExtras) {
    await user.type(
      screen.getByLabelText('Suite Number', { exact: false }),
      customExtras.suiteNumber,
    );
  }

  await user.click(screen.getByRole('button', { name: /Submit/i }));

  await waitFor(() => {
    expect(screen.getByRole('button', { name: /Finish/i })).toBeInTheDocument();
  });
}

describe('RegisteredBCToB2B Page', () => {
  const customerEmail = 'john.doe@example.com';
  const customerId = 123;

  const loggedInCustomer = buildCompanyStateWith({
    tokens: { B2BToken: 'test-b2b-token' },
    customer: {
      id: customerId,
      firstName: 'John',
      lastName: 'Doe',
      emailAddress: customerEmail,
      phoneNumber: '1234567890',
      role: CustomerRole.B2C,
    },
  });

  beforeEach(() => {
    vi.spyOn(b2bService, 'getB2BAccountFormFields').mockResolvedValue({
      accountFormFields: formType3Fields,
    });
    vi.spyOn(b2bService, 'getB2BCountries').mockResolvedValue(mockCountries);
    vi.spyOn(b2bService, 'validateBCCompanyExtraFields').mockResolvedValue({ code: 200 });
    vi.spyOn(b2bService, 'validateBCCompanyUserExtraFields').mockResolvedValue({ code: 200 });
    vi.spyOn(b2bService, 'createB2BCompanyUser').mockResolvedValue({
      companyCreate: { company: { companyStatus: 1 } },
    });
    vi.spyOn(b2bService, 'uploadB2BFile').mockResolvedValue({
      code: 200,
      data: { fileSize: '' },
    });
    vi.spyOn(companyGraphqlModule, 'registerCompany').mockResolvedValue(
      mockRegisterCompanyGraphqlApproved,
    );
    vi.mocked(getCurrentCustomerInfo).mockResolvedValue({
      userType: 5,
      role: 2,
      companyRoleName: 'Junior Buyer',
    });
  });

  describe('register company flow disabled (B2B-4466.use_register_company_flow off / default)', () => {
    it('completes BC to B2B conversion flow successfully', async () => {
      const { navigation, user } = renderWithProviders(
        <RegisteredProvider>
          <RegisteredBCToB2B setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        {
          preloadedState: { company: loggedInCustomer },
        },
      );

      await completeRegistration(user, defaultBcToB2bRegistrationData);

      const finishButton = screen.getByRole('button', { name: /Finish/i });
      await user.click(finishButton);

      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith('/orders');
      });
      expect(b2bService.createB2BCompanyUser).toHaveBeenCalled();
      expect(companyGraphqlModule.registerCompany).not.toHaveBeenCalled();
    });

    it('calls createB2BCompanyUser with company payload and does not call registerCompany', async () => {
      const companyNameMarker = 'PayloadCoAlpha';

      const { user } = renderWithProviders(
        <RegisteredProvider>
          <RegisteredBCToB2B setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        {
          preloadedState: { company: loggedInCustomer },
        },
      );

      await completeRegistration(user, {
        businessDetails: {
          'Company Name': companyNameMarker,
          'Company Email': 'payloadco@example.test',
          'Company Phone Number': '5550100',
        },
        address: {
          Country: 'United States',
          'Address 1': '100 Payload St',
          'Address 2': '',
          City: 'Austin',
          State: 'California',
          'Zip Code': '78701',
        },
      });

      expect(b2bService.createB2BCompanyUser).toHaveBeenCalled();
      expect(companyGraphqlModule.registerCompany).not.toHaveBeenCalled();
      expect(b2bService.createB2BCompanyUser).toHaveBeenCalledWith(
        expect.objectContaining({ companyName: companyNameMarker }),
      );
    });

    it('does not redirect guests to login', async () => {
      const guestCustomer = buildCompanyStateWith({
        customer: {
          role: CustomerRole.GUEST,
        },
      });

      const { navigation } = renderWithProviders(
        <RegisteredProvider>
          <RegisteredBCToB2B setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        {
          preloadedState: {
            company: guestCustomer,
            global: buildGlobalStateWith({
              featureFlags: {
                'B2B-4466.use_register_company_flow': false,
              },
            }),
          },
        },
      );

      await waitFor(() => {
        expect(navigation).not.toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('register company flow enabled (B2B-4466.use_register_company_flow on)', () => {
    it('completes conversion via registerCompany with expected input and Finish navigates to orders', async () => {
      const companyNameMarker = 'RegCoMarkerX';
      const companyEmailMarker = 'regcomarker@example.test';

      const { navigation, user } = renderWithProviders(
        <RegisteredProvider>
          <RegisteredBCToB2B setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        {
          preloadedState: {
            company: loggedInCustomer,
            global: buildGlobalStateWith({
              featureFlags: { 'B2B-4466.use_register_company_flow': true },
            }),
          },
        },
      );

      await completeRegistration(user, {
        businessDetails: {
          'Company Name': companyNameMarker,
          'Company Email': companyEmailMarker,
          'Company Phone Number': '5550199',
        },
        address: {
          Country: 'United States',
          'Address 1': '200 Register Ln',
          'Address 2': 'Unit B',
          City: 'Dallas',
          State: 'California',
          'Zip Code': '75201',
        },
      });

      await waitFor(() => {
        expect(companyGraphqlModule.registerCompany).toHaveBeenCalled();
      });
      expect(b2bService.createB2BCompanyUser).not.toHaveBeenCalled();
      expect(companyGraphqlModule.registerCompany).toHaveBeenCalledWith(
        expect.objectContaining({
          name: companyNameMarker,
          email: companyEmailMarker,
          phone: '5550199',
          address: expect.objectContaining({
            firstName: 'John',
            lastName: 'Doe',
            phone: '1234567890',
            address1: '200 Register Ln',
            address2: 'Unit B',
            city: 'Dallas',
            countryCode: 'United States',
            stateOrProvince: 'California',
            postalCode: '75201',
          }),
        }),
      );

      await user.click(screen.getByRole('button', { name: /Finish/i }));

      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith('/orders');
      });
    });

    it('passes company, companyUser, and address extra fields to registerCompany', async () => {
      vi.mocked(b2bService.getB2BAccountFormFields).mockResolvedValue({
        accountFormFields: formType3FieldsWithCustomExtras,
      });

      const { user } = renderWithProviders(
        <RegisteredProvider>
          <RegisteredBCToB2B setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        {
          preloadedState: {
            company: loggedInCustomer,
            global: buildGlobalStateWith({
              featureFlags: { 'B2B-4466.use_register_company_flow': true },
            }),
          },
        },
      );

      await completeRegistration(user, defaultBcToB2bRegistrationData, {
        userCustomNote: 'UserExtraVal',
        customCoRef: 'CoExtraVal',
        suiteNumber: 'Ste-42',
      });

      await waitFor(() => {
        expect(companyGraphqlModule.registerCompany).toHaveBeenCalled();
      });

      const callInput = vi.mocked(companyGraphqlModule.registerCompany).mock.calls[0][0];

      const companyTexts = callInput.extraFields?.texts;
      expect(companyTexts?.some((t) => t.text === 'CoExtraVal')).toBe(true);

      const userTexts = callInput.companyUser?.extraFields?.texts;
      expect(userTexts?.some((t) => t.text === 'UserExtraVal')).toBe(true);

      const addressTexts = callInput.address.extraFields?.texts;
      expect(addressTexts?.some((t) => t.text === 'Ste-42')).toBe(true);
    });

    it('redirects guests to login', async () => {
      const guestCustomer = buildCompanyStateWith({
        customer: {
          role: CustomerRole.GUEST,
        },
      });

      const { navigation } = renderWithProviders(
        <RegisteredProvider>
          <RegisteredBCToB2B setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        {
          preloadedState: {
            company: guestCustomer,
            global: buildGlobalStateWith({
              featureFlags: {
                'B2B-4466.use_register_company_flow': true,
              },
            }),
          },
        },
      );

      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith('/login');
      });
    });
  });

  describe('GlobalContext registration gate (not tied to register company flow flag)', () => {
    it('redirects to login when registerEnabled is false', async () => {
      const { navigation } = renderWithProviders(
        <RegisteredProvider>
          <RegisteredBCToB2B setOpenPage={vi.fn()} />
        </RegisteredProvider>,
        {
          preloadedState: { company: loggedInCustomer },
          initialGlobalContext: { registerEnabled: false },
        },
      );

      await waitFor(() => {
        expect(navigation).toHaveBeenCalledWith('/login');
      });
    });
  });
});
